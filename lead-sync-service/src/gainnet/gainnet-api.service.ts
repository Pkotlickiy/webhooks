import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../logger';
import { IncomingLead } from '../types';
import { bitrixService } from '../services/bitrix.service';

export interface GainnetLead {
  id: number | string;
  phone?: string | null;
  email?: string | null;
  name?: string | number | null;
  text?: string | null;
  price?: number;
  sold_price?: number;
  status?: string;
  reason?: string | null;
  type?: string;
  region?: string;
  region_id?: number;
  category?: string | null;
  category_id?: number | null;
  [key: string]: unknown;
}

export class GainnetApiService {
  private client?: AxiosInstance;
  private processedLeadIds = new Set<number>();

  constructor() {
    if (!config.GAINNET_API_URL) {
      logger.warn('⚠️ GAINNET_API_URL is not configured; Gainnet API access is disabled');
      return;
    }

    this.client = axios.create({
      baseURL: config.GAINNET_API_URL.replace(/\/+$/, ''),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(config.GAINNET_API_KEY ? { Authorization: `Bearer ${config.GAINNET_API_KEY}` } : {}),
      },
    });
  }

  private ensureClient(): AxiosInstance {
    if (!this.client) {
      logger.error('❌ Gainnet API client is not configured: GAINNET_API_URL missing');
      throw new Error('Gainnet API URL required');
    }
    return this.client;
  }

  async post<T = unknown>(path: string, payload: unknown): Promise<T> {
    const client = this.ensureClient();
    const response = await client.post<T>(path, payload, {
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      logger.error('❌ Gainnet API error', {
        path,
        status: response.status,
        data: response.data,
      });
      throw new Error(`Gainnet API request failed with status ${response.status}`);
    }

    return response.data as T;
  }

  async fetchLeads(options?: {
    limit?: number;
    leadStatus?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<GainnetLead[]> {
    const payload: Record<string, unknown> = {
      api_key: config.GAINNET_API_KEY,
      limit: options?.limit ?? 20,
      lead_status: options?.leadStatus ?? '101',
    };

    if (options?.fromDate) {
      payload.from_date = options.fromDate;
    }
    if (options?.toDate) {
      payload.to_date = options.toDate;
    }

    logger.info('📡 Fetching leads from Gainnet API', { payload });
    const responseData = await this.post<unknown>('/leads', payload);

    const leads: GainnetLead[] = [];
    if (Array.isArray(responseData)) {
      leads.push(...(responseData as GainnetLead[]));
    } else if (responseData && typeof responseData === 'object') {
      const maybe = responseData as any;
      if (Array.isArray(maybe.answer)) {
        leads.push(...maybe.answer);
      } else if (Array.isArray(maybe.data)) {
        leads.push(...maybe.data);
      } else {
        leads.push(maybe as GainnetLead);
      }
    }

    logger.info('✅ Received leads from Gainnet', { count: leads.length });
    return leads;
  }

  private mapGainnetToIncoming(lead: GainnetLead): IncomingLead {
    const id = Number(lead.id ?? 0);
    const name = lead.name ? String(lead.name) : undefined;
    const phoneValue = lead.phone ? String(lead.phone).replace(/\*/g, '') : undefined;
    const price = typeof lead.price === 'number'
      ? lead.price
      : typeof lead.sold_price === 'number'
        ? lead.sold_price
        : 0;
    const region = lead.region ? String(lead.region) : 'Не указан';
    const region_id = typeof lead.region_id === 'number' ? lead.region_id : 0;
    const category = lead.category ? String(lead.category) : undefined;
    const category_id = typeof lead.category_id === 'number' ? lead.category_id : undefined;
    const type = typeof lead.type === 'string' && lead.type.toLowerCase().includes('назнач')
      ? 'Appointment'
      : 'Auction';

    return {
      id,
      phone: phoneValue ?? '',
      price,
      region,
      region_id,
      name,
      text: lead.text ?? undefined,
      category,
      category_id,
      type,
      key: undefined,
    };
  }

  async syncLeads(options?: {
    limit?: number;
    leadStatus?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{ synced: number; skipped: number; errors: number }> {
    const result = { synced: 0, skipped: 0, errors: 0 };
    const leads = await this.fetchLeads(options);

    for (const lead of leads) {
      const id = Number(lead.id ?? 0);
      if (id <= 0) {
        logger.warn('⚠️ Ignoring Gainnet lead with invalid ID', { lead });
        result.errors++;
        continue;
      }

      if (this.processedLeadIds.has(id)) {
        logger.debug(`⏭️ Skipping already processed Gainnet lead ${id}`);
        result.skipped++;
        continue;
      }

      try {
        const incomingLead = this.mapGainnetToIncoming(lead);
        const bitrixLeadId = await bitrixService.createLead(incomingLead);
        logger.info(`✅ Synced Gainnet lead ${id} to Bitrix lead ${bitrixLeadId}`);
        this.processedLeadIds.add(id);
        result.synced++;
      } catch (error) {
        logger.error('❌ Failed to sync Gainnet lead', { leadId: id, error });
        result.errors++;
      }
    }

    return result;
  }
}

export const gainnetApiService = new GainnetApiService();
