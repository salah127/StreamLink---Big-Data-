export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected' | 'mock';
    latency?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}
