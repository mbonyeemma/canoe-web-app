export const JITSI_DOMAIN =
  (import.meta as any).env?.VITE_JITSI_DOMAIN?.trim?.() ||
  'meet.canoehealthcare.com';

export function getJitsiBaseUrl(): string {
  return `https://${JITSI_DOMAIN}`;
}

