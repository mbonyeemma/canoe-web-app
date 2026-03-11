import { getJitsiBaseUrl } from '../config/jitsi';

export type CallType = 'video' | 'audio';

export function sanitizeRoom(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 128);
}

export function generateRoomId(): string {
  try {
    return globalThis.crypto.randomUUID().replace(/-/g, '');
  } catch {
    return `room-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function buildCallPath(roomId: string, opts?: { audioOnly?: boolean; appointmentId?: string }): string {
  const audioOnly = !!opts?.audioOnly;
  const params = new URLSearchParams();
  if (audioOnly) params.set('audioOnly', 'true');
  if (opts?.appointmentId) params.set('appointmentId', opts.appointmentId);
  const qs = params.toString();
  return `/call/${encodeURIComponent(roomId)}${qs ? `?${qs}` : ''}`;
}

export function buildCallUrl(roomId: string, opts?: { audioOnly?: boolean; appointmentId?: string }): string {
  // Prefer canonical /call route so web + mobile links match one pattern
  return `${window.location.origin}${buildCallPath(roomId, opts)}`;
}

export function buildJitsiJoinUrl(roomId: string, jwt?: string): string {
  // Direct Jitsi join URL (used by mobile WebView when needed)
  const base = getJitsiBaseUrl();
  const params = new URLSearchParams();
  if (jwt) params.set('jwt', jwt);
  return `${base}/${encodeURIComponent(roomId)}${params.toString() ? `?${params.toString()}` : ''}`;
}

export function extractMeetingFromUrl(url: string): { meetingId?: string; appointmentId?: string; audioOnly?: boolean } {
  try {
    const full = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    const u = new URL(full);
    const path = u.pathname || '';
    const parts = path.split('/').filter(Boolean);
    let meetingId: string | undefined;
    if (path.startsWith('/call/') && parts.length >= 2) {
      meetingId = decodeURIComponent(parts[1]);
    } else {
      // self-hosted Jitsi: /<room>
      meetingId = parts.length >= 1 ? decodeURIComponent(parts[0]) : undefined;
    }
    const appointmentId = u.searchParams.get('appointmentId') || undefined;
    const audioOnly = u.searchParams.get('audioOnly') === 'true';
    return { meetingId, appointmentId, audioOnly };
  } catch {
    return {};
  }
}

