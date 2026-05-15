import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { IncomingLead, BitrixLeadPayload, BitrixApiResponse } from '../types';
import { normalizePhone, parseFullName } from './validator';
import { logger } from '../logger';

export class BitrixService {
  private client?: AxiosInstance;

  constructor() {
    if (!config.BITRIX24_WEBHOOK_URL) {
      logger.warn('⚠️ BITRIX24_WEBHOOK_URL is not configured; lead forwarding to Bitrix24 will be disabled');
      return;
    }

    this.client = axios.create({
      baseURL: config.BITRIX24_WEBHOOK_URL.replace(/\/+$/, ''),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Преобразование лида в формат Bitrix24
   */
  private mapToBitrixFormat(lead: IncomingLead): BitrixLeadPayload {
    const { name, lastName } = parseFullName(lead.name);
    
    // Формирование заголовка (TITLE) - обязательно включаем категорию для наглядности
    const titleParts: string[] = [];
    if (lead.category) {
      titleParts.push(`[${lead.category}]`);
    }
    titleParts.push(lead.type === 'Auction' ? '🔨 Аукцион' : '📅 Запись');
    titleParts.push(`${lead.region} • ${lead.price}₽`);

    // Комментарии (COMMENTS) - сюда пишем ВСЮ детальную информацию
    const comments: string[] = [];
    
    // 1. Текст заявки (самое важное)
    if (lead.text && lead.text.trim()) {
      comments.push('--- ТЕКСТ ЗАЯВКИ ---');
      comments.push(lead.text);
      comments.push('---------------------');
    }
    
    // 2. Детали категории
    if (lead.category) {
      comments.push(`📂 Категория: ${lead.category}`);
    }
    if (lead.category_id) {
      comments.push(`🆔 ID Категории: ${lead.category_id}`);
    }
    
    // 3. Техническая информация
    comments.push(`-----------------------------------`);
    comments.push(`🆔 ID в источнике: ${lead.id}`);
    comments.push(`🌐 Тип лида: ${lead.type}`);
    comments.push(`🌍 Регион: ${lead.region} (ID: ${lead.region_id})`);
    if (lead.phone) {
      comments.push(`📞 Телефон: ${lead.phone}`);
    }

    // Телефон для стандартного поля
    const phoneField = lead.phone 
      ? [{ VALUE: normalizePhone(lead.phone), VALUE_TYPE: 'WORK' }] 
      : [];

    return {
      fields: {
        TITLE: titleParts.join(' '),
        NAME: name,
        LAST_NAME: lastName,
        PHONE: phoneField,
        CURRENCY_ID: 'RUB',
        OPPORTUNITY: lead.price,
        STATUS_ID: config.BITRIX24_DEAL_STAGE,
        COMMENTS: comments.join('\n'),
        SOURCE_ID: 'OTHER',
        // В описание источника дублируем тип и категорию для быстрого просмотра в списке
        SOURCE_DESCRIPTION: `${lead.type}${lead.category ? ` | ${lead.category}` : ''}`,
        CATEGORY_ID: lead.category_id, // Стандартное поле привязки к категории (если используется в Битриксе)
        OPENED: 'Y',
        ORIGINATOR_ID: 'external_lead_webhook',
        ORIGIN_ID: `src_${lead.id}_type_${lead.type}`,
        // Пользовательские поля (только если они точно созданы в вашем портале)
        // Мы дублируем регион, так как это частый кейс, но text/category теперь надежно в COMMENTS
        UF_CRM_REGION: lead.region,
      },
      params: {
        REGISTER_SONET_EVENT: 'Y',
      },
    };
  }

  /**
   * Отправка лида в Bitrix24
   */
  async createLead(lead: IncomingLead): Promise<number> {
    if (!this.client) {
      logger.error('❌ Bitrix service is not configured: BITRIX24_WEBHOOK_URL missing');
      throw new Error('Bitrix24 webhook URL required');
    }

    const payload = this.mapToBitrixFormat(lead);
    
    logger.info(`📤 Sending lead ${lead.id} to Bitrix24`, { 
      title: payload.fields.TITLE,
      originId: payload.fields.ORIGIN_ID 
    });

    try {
      const response = await this.client.post<BitrixApiResponse>(
        '/crm.lead.add',
        payload,
        {
          validateStatus: () => true, // Обрабатываем ошибки вручную
        }
      );

      if (response.status !== 200 || response.data.error) {
        const error = response.data.error_description || 'Unknown Bitrix24 error';
        logger.error(`❌ Bitrix24 API error: ${error}`, { 
          status: response.status, 
          data: response.data 
        });
        throw new Error(`Bitrix24 error: ${error}`);
      }

      const leadId = response.data.result;
      if (!leadId) {
        throw new Error('Bitrix24 returned empty result');
      }

      logger.info(`✅ Lead created in Bitrix24: ${leadId}`);
      return leadId;

    } catch (error) {
      if (error instanceof Error) {
        logger.error(`🔥 Failed to create lead in Bitrix24: ${error.message}`);
        throw error;
      }
      throw new Error('Unexpected error calling Bitrix24 API');
    }
  }
}

export const bitrixService = new BitrixService();
