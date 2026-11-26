import { ZodError } from "zod";
import { registrationService } from "../services/registration.service";
import {
  adminUpdateRegistrationSchema,
  eventRegistrationSchema,
  venueLookupSchema,
} from "../validators/registration.validator";

function formatError(err: unknown, fallback: string): string {
  if (err instanceof ZodError) {
    return err.issues.map((i) => i.message).join("; ");
  }
  return err instanceof Error ? err.message : fallback;
}

export class RegistrationController {
  async handleVenueLookup(payload: unknown) {
    try {
      const parsed = venueLookupSchema.parse(payload);
      const result = await registrationService.lookupForVenue(
        parsed.query,
        parsed.eventId
      );
      return { success: true, data: result };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to look up alumni details"),
      };
    }
  }

  async handleSubmitRegistration(payload: unknown) {
    try {
      const parsed = eventRegistrationSchema.parse(payload);
      const registration = await registrationService.submitRegistration(parsed);
      return {
        success: true,
        data: registration,
        message: "Registration and check-in completed successfully",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to submit registration"),
      };
    }
  }

  async handleListRegistrations(params: {
    eventId?: number;
    graduatingYear?: number;
    stream?: string;
    registrationSource?: string;
    paymentMode?: string;
    search?: string;
  }) {
    try {
      const data = await registrationService.listRegistrations({
        eventId: params.eventId,
        graduatingYear: params.graduatingYear,
        stream: params.stream,
        registrationSource: params.registrationSource,
        paymentMode: params.paymentMode,
        search: params.search,
        limit: 3000,
      });
      return { success: true, data };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to list registrations"),
      };
    }
  }

  async handleUpdateRegistration(registrationId: number, payload: unknown) {
    try {
      const parsed = adminUpdateRegistrationSchema.parse(payload);
      const updated = await registrationService.updateRegistration(
        registrationId,
        parsed
      );
      return {
        success: true,
        data: updated,
        message: "Registration updated successfully",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to update registration"),
      };
    }
  }

  async handleDeleteRegistration(registrationId: number) {
    try {
      const ok = await registrationService.deleteRegistration(registrationId);
      return {
        success: ok,
        message: ok ? "Registration deleted" : "Failed to delete registration",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to delete registration"),
      };
    }
  }

  async handleDashboardAnalytics(eventId?: number) {
    try {
      const summary = await registrationService.getDashboardAnalytics(eventId);
      return { success: true, data: summary };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to load dashboard analytics"),
      };
    }
  }
}

export const registrationController = new RegistrationController();
