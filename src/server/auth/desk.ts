import { eventRepository } from "../repositories/event.repository";
import { pinFingerprint } from "./session";

/**
 * The PIN desk volunteers must use right now: the published event's own PIN,
 * or the DESK_PIN environment variable while migration 003 is not applied.
 */
export async function currentDeskPin(): Promise<{ eventId: number; pin: string | null } | null> {
  const event = await eventRepository.getActiveEvent();
  if (!event) return null;
  const pin = event.desk_pin === undefined ? process.env.DESK_PIN || null : event.desk_pin;
  return { eventId: event.event_id, pin: pin && pin.length >= 4 ? pin : null };
}

export async function currentPinVersion(): Promise<{ eventId: number; pv: string } | null> {
  const current = await currentDeskPin();
  if (!current?.pin) return null;
  return { eventId: current.eventId, pv: await pinFingerprint(current.pin) };
}
