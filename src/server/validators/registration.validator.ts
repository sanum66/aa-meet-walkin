import { z } from "zod";
import {
  FIRST_BATCH_YEAR,
  LATEST_BATCH_YEAR,
  PAYMENT_MODES,
  REGISTRATION_MEMBERSHIP_TYPES,
  REGISTRATION_SOURCES,
} from "../constants";

export const venueLookupSchema = z.object({
  eventId: z.coerce.number().int().positive().optional(),
  query: z.string().trim().min(3, "Please enter your email or mobile number"),
});

export type VenueLookupInput = z.infer<typeof venueLookupSchema>;

export const eventRegistrationSchema = z.object({
  eventId: z.coerce.number().int().positive("Valid active event ID is required"),
  memberLoginId: z.string().trim().optional().nullable(),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  mobile: z.string().trim().min(7, "Please enter a valid mobile number").max(20),
  course: z.string().trim().optional().nullable(),
  stream: z.string().trim().optional().nullable(),
  graduatingYear: z.coerce
    .number()
    .int()
    .min(FIRST_BATCH_YEAR, `Graduating year must be ${FIRST_BATCH_YEAR} or later`)
    .max(LATEST_BATCH_YEAR, `Graduating year must be ${LATEST_BATCH_YEAR} or earlier`),
  membershipTypeUsed: z
    .enum(REGISTRATION_MEMBERSHIP_TYPES)
    .default("UNREGISTERED_MEMBER"),
  registrationSource: z.enum(REGISTRATION_SOURCES).default("ON_SPOT"),
  recognizedMember: z.boolean().default(false),
  foodPreference: z.string().trim().default("Vegetarian"),
  accompanyingAlumniCount: z.coerce.number().int().min(0).default(0),
  accompanyingFamilyCount: z.coerce.number().int().min(0).default(0),
  voluntaryContribution: z.coerce.number().min(0).default(0),
  paymentMode: z.enum(PAYMENT_MODES).optional().nullable(),
  utrLast4: z.string().trim().optional().nullable(),
});

export type EventRegistrationInput = z.infer<typeof eventRegistrationSchema>;

export const adminUpdateRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  mobile: z.string().trim().max(20).optional().nullable(),
  course: z.string().trim().optional().nullable(),
  stream: z.string().trim().optional().nullable(),
  graduatingYear: z.coerce
    .number()
    .int()
    .min(FIRST_BATCH_YEAR)
    .max(LATEST_BATCH_YEAR)
    .optional()
    .nullable(),
  foodPreference: z.string().trim().optional().nullable(),
  accompanyingAlumniCount: z.coerce.number().int().min(0).optional(),
  accompanyingFamilyCount: z.coerce.number().int().min(0).optional(),
  registrationFee: z.coerce.number().min(0).optional(),
  voluntaryContribution: z.coerce.number().min(0).optional(),
  paymentMode: z.enum(PAYMENT_MODES).optional().nullable(),
  paymentConfirmed: z.boolean().optional(),
  utrLast4: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/, "UTR reference must be exactly 4 digits")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type AdminUpdateRegistrationInput = z.infer<
  typeof adminUpdateRegistrationSchema
>;
