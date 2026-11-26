import { supabaseAdmin } from "../config/supabase";
import { Event, EventFeeConfiguration } from "@/types/database.types";

const client = supabaseAdmin;

export class EventRepository {
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await client
      .from("events")
      .select("*")
      .order("event_date", { ascending: false })
      .order("event_id", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error.message);
      return [];
    }
    return (data as Event[]) || [];
  }

  async getActiveEvent(): Promise<Event | null> {
    const { data, error } = await client
      .from("events")
      .select("*")
      .eq("is_active", true)
      .order("event_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching active event:", error.message);
      return null;
    }
    return (data as Event) || null;
  }

  async getEventById(eventId: number): Promise<Event | null> {
    const { data, error } = await client
      .from("events")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching event ${eventId}:`, error.message);
      return null;
    }
    return (data as Event) || null;
  }

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const { data, error } = await client
      .from("events")
      .insert(eventData)
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error.message);
      throw new Error(error.message);
    }
    return data as Event;
  }

  async updateEvent(eventId: number, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await client
      .from("events")
      .update(updates)
      .eq("event_id", eventId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating event ${eventId}:`, error.message);
      if (/desk_pin/.test(error.message)) {
        throw new Error(
          "Desk PINs need a database update. Run data/DataBase_design/003_event_desk_pin.sql in Supabase."
        );
      }
      throw new Error(error.message);
    }
    return data as Event;
  }

  async deactivateAllEvents(): Promise<void> {
    const { error } = await client
      .from("events")
      .update({ is_active: false })
      .gt("event_id", 0);

    if (error) {
      console.error("Error deactivating events:", error.message);
    }
  }

  async deleteEvent(eventId: number): Promise<boolean> {
    const { error } = await client
      .from("events")
      .delete()
      .eq("event_id", eventId);

    if (error) {
      console.error(`Error deleting event ${eventId}:`, error.message);
      return false;
    }
    return true;
  }

  // Fee Configuration Methods
  async getFeeConfigurations(eventId: number): Promise<EventFeeConfiguration[]> {
    const { data, error } = await client
      .from("event_fee_configurations")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true })
      .order("min_graduating_year", { ascending: true });

    if (error) {
      console.error(`Error fetching fee configs for event ${eventId}:`, error.message);
      return [];
    }
    return (data as EventFeeConfiguration[]) || [];
  }

  async upsertFeeConfigurations(
    configs: Partial<EventFeeConfiguration>[]
  ): Promise<EventFeeConfiguration[]> {
    if (configs.length === 0) return [];

    const { data, error } = await client
      .from("event_fee_configurations")
      .upsert(configs, {
        onConflict:
          "event_id,membership_type,min_graduating_year,max_graduating_year",
      })
      .select();

    if (error) {
      console.error("Error upserting fee configurations:", error.message);
      throw new Error(error.message);
    }
    return (data as EventFeeConfiguration[]) || [];
  }

  /**
   * Replaces the complete fee schedule of an event. Upserting alone would keep
   * stale rows around whenever an organizer edits a batch range.
   */
  async replaceFeeConfigurations(
    eventId: number,
    configs: Partial<EventFeeConfiguration>[]
  ): Promise<EventFeeConfiguration[]> {
    const { data: previous, error: readError } = await client
      .from("event_fee_configurations")
      .select("*")
      .eq("event_id", eventId);
    if (readError) throw new Error(readError.message);

    const { error: deleteError } = await client
      .from("event_fee_configurations")
      .delete()
      .eq("event_id", eventId);
    if (deleteError) throw new Error(deleteError.message);

    if (configs.length === 0) return [];
    const { data, error } = await client
      .from("event_fee_configurations")
      .insert(configs.map((c) => ({ ...c, event_id: eventId })))
      .select();

    if (error) {
      // Restore the previous schedule so the event never ends up without fees
      if (previous && previous.length > 0) {
        await client
          .from("event_fee_configurations")
          .insert(
            (previous as EventFeeConfiguration[]).map(
              ({ fee_configuration_id: _id, created_at: _c, updated_at: _u, ...rest }) => rest
            )
          );
      }
      if (error.code === "23505") {
        throw new Error(
          "Two fee rules have the same membership type and batch range. Remove the duplicate."
        );
      }
      throw new Error(error.message);
    }
    return (data as EventFeeConfiguration[]) || [];
  }

  async updateFeeConfiguration(
    feeConfigId: number,
    updates: Partial<EventFeeConfiguration>
  ): Promise<EventFeeConfiguration> {
    const { data, error } = await client
      .from("event_fee_configurations")
      .update(updates)
      .eq("fee_configuration_id", feeConfigId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating fee config ${feeConfigId}:`, error.message);
      throw new Error(error.message);
    }
    return data as EventFeeConfiguration;
  }
}

export const eventRepository = new EventRepository();
