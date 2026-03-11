import api from './api';
import { extractMeetingFromUrl } from '../utils/meetings';

export async function joinAppointmentCall(params: {
  appointmentId: string;
}): Promise<{ meetingId?: string; joinUrl?: string }> {
  const res = await api.parseResponse<{ data?: { url?: string; join_url?: string; meeting_id?: string } }>(
    await api.post(`/appointments/${params.appointmentId}/join-call`, {})
  );
  const meetingId = res.data?.meeting_id || undefined;
  const joinUrl = res.data?.url || res.data?.join_url || undefined;
  return { meetingId, joinUrl };
}

export function resolveMeetingIdFromJoinUrl(joinUrl: string): string | null {
  if (!joinUrl) return null;
  if (!joinUrl.startsWith('http')) {
    // backend often returns a room id here
    return joinUrl;
  }
  const { meetingId } = extractMeetingFromUrl(joinUrl);
  return meetingId || null;
}

