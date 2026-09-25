// Sessions intentionally end on page reload. Tokens never persist in browser storage.
let currentToken: string | null = null;
try { localStorage.removeItem('inventory_token'); } catch { /* Storage may be disabled. */ }

export function getToken(): string | null { return currentToken; }
export function setToken(token: string | null): void { currentToken = token; }
export function clearToken(): void { currentToken = null; }
export function isAuthenticated(): boolean { return currentToken !== null; }
