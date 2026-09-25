import { describe, it, expect, vi } from 'vitest';

describe('in-memory sessions', () => {
  it('removes legacy persistent tokens and does not restore tokens after reload', async () => {
    localStorage.setItem('inventory_token', 'legacy-token');
    vi.resetModules();
    const session = await import('./auth');
    expect(session.getToken()).toBeNull();
    expect(localStorage.getItem('inventory_token')).toBeNull();
    session.setToken('current-token');
    expect(session.isAuthenticated()).toBe(true);
    expect(localStorage.getItem('inventory_token')).toBeNull();
    vi.resetModules();
    expect((await import('./auth')).getToken()).toBeNull();
    session.clearToken();
    expect(session.isAuthenticated()).toBe(false);
  });
});
