import { eventRepository } from "../repositories/event.repository";
import {
  DEFAULT_BATCH_FEE_TIERS,
  REGISTRATION_MEMBERSHIP_TYPES,
  RegistrationMembershipType,
} from "../constants";
import { EventInput, FeeConfigurationInput } from "../validators/event.validator";
import { Event, EventFeeConfiguration } from "@/types/database.types";

export class EventService {
  async getAllEvents(): Promise<Event[]> {
    return eventRepository.getAllEvents();
  }

  /** The published event (open for check-in), or null when none is published. */
  async getActiveEvent(): Promise<Event | null> {
    return eventRepository.getActiveEvent();
  }

  async getEventById(eventId: number): Promise<Event | null> {
    return eventRepository.getEventById(eventId);
  }

  async createEvent(input: EventInput): Promise<Event> {
    if (input.isActive) {
      await eventRepository.deactivateAllEvents();
    }

    const created = await eventRepository.createEvent({
      event_name: input.eventName,
      event_type: input.eventType,
      chapter_name: input.chapterName,
      venue: input.venue || null,
      event_date: input.eventDate,
      event_time: input.eventTime || null,
      description: input.description || null,
      is_active: input.isActive,
    });

    // Automatically seed default batch fee rules for all membership tiers
    await this.seedDefaultFeeConfigurations(created.event_id);

    return created;
  }

  async seedDefaultFeeConfigurations(
    eventId: number
  ): Promise<EventFeeConfiguration[]> {
    const rows: Partial<EventFeeConfiguration>[] = [];

    for (const membershipType of REGISTRATION_MEMBERSHIP_TYPES) {
      for (const tier of DEFAULT_BATCH_FEE_TIERS) {
        rows.push({
          event_id: eventId,
          min_graduating_year: tier.minGraduatingYear,
          max_graduating_year: tier.maxGraduatingYear,
          membership_type: membershipType,
          registration_fee: tier.registrationFee,
          display_order: tier.displayOrder,
          is_active: true,
        });
      }
    }

    return eventRepository.upsertFeeConfigurations(rows);
  }

  async updateEvent(
    eventId: number,
    input: Partial<EventInput>
  ): Promise<Event> {
    if (input.isActive) {
      await eventRepository.deactivateAllEvents();
    }

    const updates: Partial<Event> = {};
    if (input.eventName !== undefined) updates.event_name = input.eventName;
    if (input.eventType !== undefined) updates.event_type = input.eventType;
    if (input.chapterName !== undefined) updates.chapter_name = input.chapterName;
    if (input.venue !== undefined) updates.venue = input.venue || null;
    if (input.eventDate !== undefined) updates.event_date = input.eventDate;
    if (input.eventTime !== undefined) updates.event_time = input.eventTime || null;
    if (input.description !== undefined)
      updates.description = input.description || null;
    if (input.isActive !== undefined) updates.is_active = input.isActive;
    if (input.deskPin !== undefined) updates.desk_pin = input.deskPin || null;

    return eventRepository.updateEvent(eventId, updates);
  }

  async deleteEvent(eventId: number): Promise<boolean> {
    return eventRepository.deleteEvent(eventId);
  }

  async getFeeConfigurations(eventId: number): Promise<EventFeeConfiguration[]> {
    return eventRepository.getFeeConfigurations(eventId);
  }

  async updateFeeRules(
    eventId: number,
    rules: FeeConfigurationInput[]
  ): Promise<EventFeeConfiguration[]> {
    const payload: Partial<EventFeeConfiguration>[] = rules.map((r) => ({
      event_id: eventId,
      min_graduating_year: r.minGraduatingYear,
      max_graduating_year: r.maxGraduatingYear,
      membership_type: r.membershipType,
      registration_fee: r.registrationFee,
      display_order: r.displayOrder,
      is_active: r.isActive,
    }));

    return eventRepository.replaceFeeConfigurations(eventId, payload);
  }

  /**
   * Computes the applicable venue registration fee based on event fee rules,
   * graduating year, and membership classification.
   */
  async calculateRegistrationFee(
    eventId: number,
    graduatingYear: number | null | undefined,
    membershipType: RegistrationMembershipType = "UNREGISTERED_MEMBER"
  ): Promise<number> {
    if (!graduatingYear) return 0;

    const rules = await eventRepository.getFeeConfigurations(eventId);
    const activeRules = rules.filter((r) => r.is_active);

    if (activeRules.length > 0) {
      const exactMatch = activeRules.find(
        (r) =>
          r.membership_type === membershipType &&
          graduatingYear >= r.min_graduating_year &&
          graduatingYear <= r.max_graduating_year
      );
      if (exactMatch) {
        return Number(exactMatch.registration_fee) || 0;
      }

      // A rule only applies to the member types it was set for; anything not
      // covered falls through to the standard schedule below.
    }

    // Fallback to default batch schedule
    const defaultTier = DEFAULT_BATCH_FEE_TIERS.find(
      (t) =>
        graduatingYear >= t.minGraduatingYear &&
        graduatingYear <= t.maxGraduatingYear
    );
    if (defaultTier) {
      return defaultTier.registrationFee;
    }

    return graduatingYear >= 2021 ? 0 : 500;
  }
}

export const eventService = new EventService();
