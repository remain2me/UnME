// Converts a base64 public key into a URL-safe string (for use in routes)
export function toUrlSafeKey(base64Key: string): string {
  return base64Key.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Converts a URL-safe key back into its original base64 form
export function fromUrlSafeKey(urlSafeKey: string): string {
  let base64 = urlSafeKey.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return base64;
}