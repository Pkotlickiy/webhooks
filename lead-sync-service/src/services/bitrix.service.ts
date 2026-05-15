import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { IncomingLead, BitrixLeadPayload, BitrixApiResponse } from '../types';
import { normalizePhone, parseFullName } from './validator';
import { logger } from '../index';

export class BitrixService {
  private client: AxiosInstance;

  constructor() {
    if (!config.BITRIX24_WEBHOOK_URL) {
      logger.error('❌ BITRIX24_WEBHOOK_URL is not configured');
      throw new Error('Bitrix24 webhook URL required');
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
    
    // Формирование заголовка
    const titleParts: string[] = [];
    if (lead.category) titleParts.push(`[${lead.category}]`);
    titleParts.push(lead.type === 'Auction' ? '🔨 Аукцион' : '📅 Запись');
    titleParts.push(`${lead.region} • ${lead.price}₽`);

    // Комментарии
    const comments: string[] = [];
    if (lead.text) comments.push(`📝 ${lead.text}`);
    comments.push(`🆔 Источник: ID=${lead.id}, тип=${lead.type}`);
    comments.push(`🌍 Регион: ${lead.region} (ID: ${lead.region_id})`);
    if (lead.category_id) {
      comments.push(`📂 Категория ID: ${lead.category_id}`);
    }

    // Телефон
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
        SOURCE_DESCRIPTION: `${lead.type} | ${lead.category || 'Без категории'}`,
        CATEGORY_ID: lead.category_id,
        OPENED: 'Y',
        ORIGINATOR_ID: 'external_lead_webhook',
        ORIGIN_ID: `src_${lead.id}_type_${lead.type}`,
        // Пользовательские поля (если созданы в вашем портале)
        UF_CRM_REGION: lead.region,
        UF_CRM_EXTERNAL_TYPE: lead.type,
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
