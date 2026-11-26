import { NextRequest } from "next/server";
import { SESSION_COOKIE, SessionPayload, verifySession } from "./session";
import { currentPinVersion } from "./desk";

/** Returned when the desk session is missing or no longer valid (HTTP 401). */
export const SIGN_IN_AGAIN = "Your desk session has ended. Sign in again with the current desk PIN.";

export function guardStatus(message: string): number {
  return message === SIGN_IN_AGAIN ? 401 : 403;
}

export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value).catch(() => null);
}

/**
 * Desk volunteers may only work on the event they signed in to, while it is
 * still published and its PIN is unchanged. Returns an error message when the
 * request is not allowed, otherwise null. Organizers always pass.
 */
export async function deskEventGuard(
  req: NextRequest,
  eventId?: number,
  requireEvent = false
): Promise<string | null> {
  const session = await getSession(req);
  if (!session) return SIGN_IN_AGAIN;
  if (session.role === "admin") return null;

  const current = await currentPinVersion();
  if (!current || session.eid !== current.eventId || session.pv !== current.pv) {
    return SIGN_IN_AGAIN;
  }
  if ((requireEvent && eventId === undefined) || (eventId !== undefined && eventId !== current.eventId)) {
    return "Desk volunteers can only view the published event.";
  }
  return null;
}
