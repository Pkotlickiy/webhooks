import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { logger } from '../logger';

export class GainnetApiService {
  private client?: AxiosInstance;

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

    const responseData = response.data as any;
    let leads: any[] = [];
    // Парсинг ответа
    if (Array.isArray(responseData.answer)) {
      leads = responseData.answer;
    }

    return leads as unknown as T;
  }

  async get<T = unknown>(path: string): Promise<T> {
    const client = this.ensureClient();
    const response = await client.get<T>(path, {
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

    return response.data;
  }
}

export const gainnetApiService = new GainnetApiService();
