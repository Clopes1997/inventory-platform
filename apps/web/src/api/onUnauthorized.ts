/**
 * Optional callback for 401 responses. Set by the app (e.g. in App.tsx) so the
 * API client can trigger a SPA-style redirect to login instead of a full page reload.
 */
type UnauthorizedCallback = (() => void) | null;
let onUnauthorizedCallback: UnauthorizedCallback = null;

export function setOnUnauthorized(callback: UnauthorizedCallback): void {
  onUnauthorizedCallback = callback;
}

export function getOnUnauthorized(): UnauthorizedCallback {
  return onUnauthorizedCallback;
}
