import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { useAuthStore } from '../store/auth';
import {
    DashboardStats,
    Follow,
    LoginResponse,
    Order,
    Poll,
    Product,
    Redemption,
    Reward,
    StreamerProfile,
    StreamPlatform,
    TrendingStreamsResponse,
} from '../types/api';

const API_PATH = '/api/v1';

const normalizeBaseUrl = (value: string) => value.replace(/\/$/, '');

const resolveApiBaseUrl = (): string => {
  const envUrl =
    process.env.EXPO_PUBLIC_API_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    process.env.EXPO_PUBLIC_API_HOST;

  if (envUrl) {
    return normalizeBaseUrl(envUrl);
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return normalizeBaseUrl(window.location.origin);
  }

  const manifestLike: Partial<typeof Constants> & {
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  } = Constants;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    manifestLike.manifest?.debuggerHost ??
    manifestLike.manifest2?.extra?.expoClient?.hostUri ??
    '';

  if (hostUri) {
    const normalized = hostUri.startsWith('http') ? hostUri : `http://${hostUri}`;
    try {
      const url = new URL(normalized);
      const hostname = url.hostname;
      if (hostname) {
        return `http://${hostname}:3001`;
      }
    } catch {/* swallow parse errors */}
  }

  return 'http://localhost:3001';
};

export const API_ORIGIN = resolveApiBaseUrl();
const API_BASE_URL = `${API_ORIGIN}${API_PATH}`;

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { token } = useAuthStore.getState();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[ApiService] Network request failed', error);
      }
      throw new Error('Unable to reach the StreamLink API. Please ensure the backend server is running.');
    }

    const responseClone = response.clone();
    
    if (!response.ok) {
      let errorMessage = 'Request failed. Please try again.';

      try {
        const errorData = await responseClone.json();
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } catch {
        const fallback = await responseClone.text();
        if (fallback) {
          errorMessage = fallback;
        }
      }

      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    const text = await response.text();
    return text ? (text as unknown as T) : (undefined as T);
  }

  private buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry === undefined || entry === null) {
            return;
          }
          const normalized = String(entry).trim();
          if (normalized.length > 0) {
            searchParams.append(key, normalized);
          }
        });
      } else {
        const normalized = String(value).trim();
        if (normalized.length > 0) {
          searchParams.append(key, normalized);
        }
      }
    });

    const query = searchParams.toString();
    return query ? `?${query}` : '';
  }

  // Auth
  async login(payload: { loginId: string; password: string }): Promise<LoginResponse> {
    const { loginId, password } = payload;
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password }),
    });
  }

  async register(payload: {
    email: string;
    password: string;
    displayName?: string;
    role?: 'VIEWER' | 'STREAMER' | 'BOTH';
    username?: string;
  }): Promise<LoginResponse> {
    const { email, password, displayName, role, username } = payload;
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, role, username }),
    });
  }

  getSocialAuthUrl(provider: string, redirectUri: string, analyticsId?: string) {
    const normalizedProvider = provider.toLowerCase();
    const url = new URL(`${API_ORIGIN}${API_PATH}/auth/${normalizedProvider}/mobile`);
    url.searchParams.set('redirectUri', redirectUri);
    if (analyticsId) {
      url.searchParams.set('analyticsId', analyticsId);
    }
    return url.toString();
  }

  async trackSocialAuthMetric(event: {
    provider: string;
    action: 'tap' | 'success' | 'error' | 'cancel';
    context?: string;
    metadata?: Record<string, unknown>;
  }) {
    try {
      await this.request('/auth/social/metrics', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Api] Failed to record social auth metric', error);
      }
    }
  }

  // Streamers
  async getStreamerProfile(streamerId: string): Promise<StreamerProfile> {
    return this.request(`/streamers/${streamerId}/profile`);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/streamers/dashboard');
  }

  async getRewards(): Promise<Reward[]> {
    return this.request('/streamers/rewards');
  }

  async createReward(data: { title: string; description?: string; costPoints: number }): Promise<Reward> {
    return this.request('/streamers/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReward(id: string, data: Partial<Reward>): Promise<Reward> {
    return this.request(`/streamers/rewards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteReward(id: string): Promise<void> {
    return this.request(`/streamers/rewards/${id}`, {
      method: 'DELETE',
    });
  }

  // Viewers
  async followStreamer(streamerId: string) {
    return this.request(`/viewers/follow/${streamerId}`, {
      method: 'POST',
    });
  }

  async unfollowStreamer(streamerId: string) {
    return this.request(`/viewers/follow/${streamerId}`, {
      method: 'DELETE',
    });
  }

  async getFollowing(): Promise<Follow[]> {
    return this.request('/viewers/following');
  }

  async redeemReward(rewardId: string): Promise<Redemption> {
    return this.request(`/viewers/redeem/${rewardId}`, {
      method: 'POST',
    });
  }

  async getRedemptions(): Promise<Redemption[]> {
    return this.request('/viewers/redemptions');
  }

  // Interactions
  async getPolls(streamerId: string, status?: 'OPEN' | 'CLOSED'): Promise<Poll[]> {
    const query = status ? `?status=${status}` : '';
    return this.request(`/interactions/polls/${streamerId}${query}`);
  }

  async votePoll(pollId: string, optionId: string) {
    return this.request(`/interactions/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    });
  }

  async createPoll(question: string, options: string[], endsAt?: string): Promise<Poll> {
    return this.request('/interactions/polls', {
      method: 'POST',
      body: JSON.stringify({ question, options, endsAt }),
    });
  }

  // Marketplace
  async getProducts(streamerId: string): Promise<Product[]> {
    return this.request(`/marketplace/products/${streamerId}?active=true`);
  }

  async createProduct(data: { title: string; description?: string; price: number }): Promise<Product> {
    return this.request('/marketplace/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createOrder(productId: string): Promise<{ order: Order; checkoutUrl: string }> {
    return this.request('/marketplace/orders', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  }

  async getOrders(role: 'buyer' | 'seller' = 'buyer'): Promise<Order[]> {
    return this.request(`/marketplace/orders?role=${role}`);
  }

  // Points
  async getPointsBalance(streamerId?: string): Promise<{ balance: number }> {
    const query = streamerId ? `?streamerId=${streamerId}` : '';
    return this.request(`/users/me/points${query}`);
  }

  async getTrendingStreams(options: {
    limit?: number;
    cursor?: string;
    category?: string;
    platforms?: StreamPlatform[];
  } = {}): Promise<TrendingStreamsResponse> {
    const { limit, cursor, category, platforms } = options;

    const query = this.buildQueryString({
      limit,
      cursor,
      category,
      platforms: platforms?.map((platform) => platform.toUpperCase()),
    });

    return this.request(`/streams/trending${query}`);
  }
}

export const api = new ApiService();