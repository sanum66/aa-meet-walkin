// ---------------------------------------------------
// SYSTEM CONSTANTS & DATABASE ENUMS
// ---------------------------------------------------

export const ORGANIZATION_NAME =
  "Institute of Road and Transport Technology Alumni Association";
export const SHORT_ORGANIZATION_NAME = "IRTTAA NuzhAI";

/** First graduating batch of the institute. */
export const FIRST_BATCH_YEAR = 1988;
/**
 * Latest selectable batch: current students graduating in the next few years.
 * Computed from today's date so the portal keeps working year after year.
 */
export const LATEST_BATCH_YEAR = new Date().getFullYear() + 4;

export const BATCH_YEARS = Array.from(
  { length: LATEST_BATCH_YEAR - FIRST_BATCH_YEAR + 1 },
  (_, i) => FIRST_BATCH_YEAR + i
).reverse();

export const ASSOCIATION_MEMBERSHIP_TYPES = [
  "PATRON_MEMBER",
  "LIFE_MEMBER",
  "REGISTERED_MEMBER",
] as const;
export type AssociationMembershipType =
  (typeof ASSOCIATION_MEMBERSHIP_TYPES)[number];

export const REGISTRATION_MEMBERSHIP_TYPES = [
  "PATRON_MEMBER",
  "LIFE_MEMBER",
  "REGISTERED_MEMBER",
  "UNREGISTERED_MEMBER",
] as const;
export type RegistrationMembershipType =
  (typeof REGISTRATION_MEMBERSHIP_TYPES)[number];

export const EVENT_TYPES = [
  "CHAPTER_EVENT",
  "ANNUAL_MEET",
  "SPECIAL_EVENT",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const PRE_REGISTRATION_RESPONSE_STATUSES = [
  "GOING",
  "MAY_BE",
  "NOT_GOING",
] as const;
export type PreRegistrationResponseStatus =
  (typeof PRE_REGISTRATION_RESPONSE_STATUSES)[number];

export const REGISTRATION_SOURCES = ["PRE_REGISTERED", "ON_SPOT"] as const;
export type RegistrationSource = (typeof REGISTRATION_SOURCES)[number];

export const PAYMENT_MODES = ["ONLINE", "CASH"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const COURSE_TYPES = ["BE", "ME", "MCA"] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

export const STREAM_TYPES = [
  "AUTO",
  "CIVIL",
  "CTRANS",
  "CSE",
  "EEE",
  "ECE",
  "IT",
  "MECH",
  "STRUCT",
  "THERM",
  "TRANS",
] as const;
export type StreamType = (typeof STREAM_TYPES)[number];

export const FOOD_PREFERENCES = [
  "Vegetarian",
  "Non-Vegetarian",
  "Vegan",
] as const;
export type FoodPreference = (typeof FOOD_PREFERENCES)[number];

/**
 * Default batch-based venue fee schedule applied across membership types.
 * Admins can customize per-event fees in `event_fee_configurations`.
 */
export const DEFAULT_BATCH_FEE_TIERS = [
  {
    minGraduatingYear: 1988,
    maxGraduatingYear: 2000,
    registrationFee: 500,
    displayOrder: 1,
    label: "1988 - 2000",
  },
  {
    minGraduatingYear: 2001,
    maxGraduatingYear: 2010,
    registrationFee: 400,
    displayOrder: 2,
    label: "2001 - 2010",
  },
  {
    minGraduatingYear: 2011,
    maxGraduatingYear: 2020,
    registrationFee: 300,
    displayOrder: 3,
    label: "2011 - 2020",
  },
  {
    minGraduatingYear: 2021,
    maxGraduatingYear: LATEST_BATCH_YEAR,
    registrationFee: 0,
    displayOrder: 4,
    label: `2021 - ${LATEST_BATCH_YEAR} (Free Entry)`,
  },
] as const;

export const MEMBERSHIP_DISPLAY_LABELS: Record<RegistrationMembershipType, string> = {
  PATRON_MEMBER: "Patron Member",
  LIFE_MEMBER: "Life Member",
  REGISTERED_MEMBER: "Registered Member",
  UNREGISTERED_MEMBER: "Unregistered / Non-Member",
};
