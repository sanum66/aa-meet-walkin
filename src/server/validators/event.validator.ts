import { z } from "zod";
import { EVENT_TYPES, REGISTRATION_MEMBERSHIP_TYPES } from "../constants";

export const eventSchema = z.object({
  eventName: z.string().trim().min(3, "Event name must be at least 3 characters"),
  eventType: z.enum(EVENT_TYPES).default("CHAPTER_EVENT"),
  chapterName: z.string().trim().min(2, "Chapter name is required"),
  venue: z.string().trim().optional().nullable(),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Event date must be in YYYY-MM-DD format"),
  eventTime: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
  deskPin: z
    .string()
    .trim()
    .regex(/^[0-9]{4,8}$/, "Desk PIN must be 4 to 8 digits")
    .optional()
    .nullable(),
});

export type EventInput = z.infer<typeof eventSchema>;

export const feeConfigurationSchema = z
  .object({
    minGraduatingYear: z.coerce.number().int().min(1950).max(2100),
    maxGraduatingYear: z.coerce.number().int().min(1950).max(2100),
    membershipType: z.enum(REGISTRATION_MEMBERSHIP_TYPES),
    registrationFee: z.coerce.number().min(0),
    displayOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.minGraduatingYear <= data.maxGraduatingYear, {
    message: "Min graduating year must be less than or equal to max graduating year",
  });

export type FeeConfigurationInput = z.infer<typeof feeConfigurationSchema>;
