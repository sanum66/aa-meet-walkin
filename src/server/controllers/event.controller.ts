import { ZodError, z } from "zod";
import { eventService } from "../services/event.service";
import { eventSchema, feeConfigurationSchema } from "../validators/event.validator";
import { RegistrationMembershipType } from "../constants";

function formatError(err: unknown, fallback: string): string {
  if (err instanceof ZodError) {
    return err.issues.map((i) => i.message).join("; ");
  }
  return err instanceof Error ? err.message : fallback;
}

export class EventController {
  async handleListEvents() {
    try {
      const events = await eventService.getAllEvents();
      return { success: true, data: events };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to fetch events"),
      };
    }
  }

  async handleGetActiveEvent() {
    try {
      const event = await eventService.getActiveEvent();
      if (!event) {
        return { success: true, data: null, feeRules: [] };
      }
      const feeRules = await eventService.getFeeConfigurations(event.event_id);
      // Public endpoint: never expose the desk PIN
      const { desk_pin: _pin, ...publicEvent } = event;
      void _pin;
      return { success: true, data: publicEvent, feeRules };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to fetch active event"),
      };
    }
  }

  async handleCreateEvent(payload: unknown) {
    try {
      const parsed = eventSchema.parse(payload);
      const event = await eventService.createEvent(parsed);
      const feeRules = await eventService.getFeeConfigurations(event.event_id);
      return {
        success: true,
        data: event,
        feeRules,
        message: "Event created with default batch fee rules",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to create event"),
      };
    }
  }

  async handleUpdateEvent(eventId: number, payload: unknown) {
    try {
      const parsed = eventSchema.partial().parse(payload);
      const event = await eventService.updateEvent(eventId, parsed);
      return {
        success: true,
        data: event,
        message: "Event updated successfully",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to update event"),
      };
    }
  }

  async handleDeleteEvent(eventId: number) {
    try {
      const ok = await eventService.deleteEvent(eventId);
      return {
        success: ok,
        message: ok ? "Event deleted" : "Failed to delete event",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to delete event"),
      };
    }
  }

  async handleGetFeeConfigs(eventId: number) {
    try {
      const rules = await eventService.getFeeConfigurations(eventId);
      return { success: true, data: rules };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to load fee configurations"),
      };
    }
  }

  async handleUpdateFeeConfigs(eventId: number, payload: unknown) {
    try {
      const parsed = z.array(feeConfigurationSchema).parse(payload);
      const rules = await eventService.updateFeeRules(eventId, parsed);
      return {
        success: true,
        data: rules,
        message: "Fee configuration updated successfully",
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to update fee configurations"),
      };
    }
  }

  async handleCalculateFee(params: {
    eventId: number;
    graduatingYear: number;
    membershipType?: RegistrationMembershipType;
  }) {
    try {
      const fee = await eventService.calculateRegistrationFee(
        params.eventId,
        params.graduatingYear,
        params.membershipType
      );
      return { success: true, data: { registrationFee: fee } };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to calculate registration fee"),
      };
    }
  }
}

export const eventController = new EventController();
