/**
 * Standardised API error message extraction for form/submit error handling.
 * Use in .catch() so toasts and inline errors show consistent messages.
 */
export function getErrorMessage(err: unknown): string {
  if (err == null) return 'Request failed';
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  if (err instanceof Error) return err.message;
  return 'Request failed';
}
