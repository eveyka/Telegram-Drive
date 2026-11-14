import { describe, expect, it } from 'vitest';
import worker from './index';

describe('Commercial License Worker API', () => {
  it('serves admin dashboard HTML at /admin', async () => {
    const request = new Request('http://localhost:8787/admin');
    const env = {
      DB: {} as D1Database,
      APP_NAME: 'TG Drive: Unlimited Cloud',
    };

    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('Admin Licensing Control Panel');
    expect(text).toContain('TG Drive: Unlimited Cloud');
  });

  it('rejects unauthorized admin stats request', async () => {
    const request = new Request('http://localhost:8787/api/admin/stats');
    const env = {
      DB: {} as D1Database,
      ADMIN_SECRET: 'master-key-xyz',
    };

    const response = await worker.fetch(request, env);
    expect(response.status).toBe(401);
  });

  it('responds with online status at /health', async () => {
    const request = new Request('http://localhost:8787/health');
    const env = {
      DB: {} as D1Database,
      APP_NAME: 'TG Drive: Unlimited Cloud',
    };

    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
    const json = (await response.json()) as { status: string; app: string };
    expect(json.status).toBe('online');
    expect(json.app).toBe('TG Drive: Unlimited Cloud');
  });

  it('renders crash reports card and diagnostics section in admin HTML', async () => {
    const request = new Request('http://localhost:8787/admin');
    const env = {
      DB: {} as D1Database,
      APP_NAME: 'TG Drive: Unlimited Cloud',
    };

    const response = await worker.fetch(request, env);
    const text = await response.text();
    expect(text).toContain('id="statCrashReports"');
    expect(text).toContain('id="crashReportsSection"');
    expect(text).toContain('id="crashInspectModal"');
  });

  it('rejects invalid crash report event type', async () => {
    const request = new Request('http://localhost:8787/api/crash-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'invalid_event' }),
    });
    const env = {
      DB: {} as D1Database,
    };

    const response = await worker.fetch(request, env);
    expect(response.status).toBe(400);
  });

  it('validates correct admin secret at /api/admin/auth/verify', async () => {
    const request = new Request('http://localhost:8787/api/admin/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: 'test-secret-123' }),
    });
    const env = {
      DB: {} as D1Database,
      ADMIN_SECRET: 'test-secret-123',
    };

    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
    const json = (await response.json()) as { valid: boolean; success: boolean };
    expect(json.valid).toBe(true);
  });

  it('rejects wrong admin secret at /api/admin/auth/verify', async () => {
    const request = new Request('http://localhost:8787/api/admin/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: 'wrong-secret' }),
    });
    const env = {
      DB: {} as D1Database,
      ADMIN_SECRET: 'test-secret-123',
    };

    const response = await worker.fetch(request, env);
    expect(response.status).toBe(401);
  });
});

