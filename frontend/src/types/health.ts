export type HealthResponse = {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  api: {
    available: boolean;
    version: string;
  };
  database: {
    connected: boolean;
    path: string;
    tables: number;
  };
};
