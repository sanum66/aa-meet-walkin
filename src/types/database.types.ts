import {
  AssociationMembershipType,
  CourseType,
  EventType,
  PaymentMode,
  PreRegistrationResponseStatus,
  RegistrationMembershipType,
  RegistrationSource,
  StreamType,
} from "../server/constants";

export interface AssociationMember {
  member_login_id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  course: CourseType | null;
  stream: StreamType | null;
  graduating_year: number | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  membership_type: AssociationMembershipType;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  event_id: number;
  event_name: string;
  event_type: EventType;
  chapter_name: string;
  venue: string | null;
  event_date: string;
  event_time: string | null;
  description: string | null;
  is_active: boolean;
  /** Desk volunteer PIN (organizers only; undefined until migration 003 runs) */
  desk_pin?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventFeeConfiguration {
  fee_configuration_id: number;
  event_id: number;
  min_graduating_year: number;
  max_graduating_year: number;
  membership_type: RegistrationMembershipType;
  registration_fee: number;
  display_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventPreRegistration {
  pre_registration_id: number;
  event_id: number;
  member_login_id: string | null;
  full_name: string;
  course: string | null;
  stream: string | null;
  graduating_year: number | null;
  email: string;
  mobile: string | null;
  membership_type: RegistrationMembershipType;
  food_preference: string | null;
  accompanying_alumni_count: number;
  accompanying_family_count: number;
  response_status: PreRegistrationResponseStatus;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  registration_id: number;
  event_id: number;
  member_login_id: string | null;
  full_name: string;
  email: string;
  mobile: string | null;
  course: string | null;
  stream: string | null;
  graduating_year: number | null;
  membership_type_used: RegistrationMembershipType;
  registration_source: RegistrationSource;
  recognized_member: boolean;
  food_preference: string | null;
  accompanying_alumni_count: number;
  accompanying_family_count: number;
  registration_fee: number;
  voluntary_contribution: number;
  total_amount: number;
  payment_required: boolean;
  payment_mode: PaymentMode | null;
  payment_confirmed: boolean;
  utr_last4: string | null;
  paid_at: string | null;
  checked_in_at: string;
  created_at: string;
  updated_at: string;
}

export interface VenueLookupResult {
  found: boolean;
  source: "PRE_REGISTERED" | "ASSOCIATION_MEMBER" | "NONE";
  alreadyRegistered: boolean;
  existingRegistration: EventRegistration | null;
  computedRegistrationFee: number;
  prefill: {
    member_login_id: string | null;
    full_name: string;
    email: string;
    mobile: string;
    course: string;
    stream: string;
    graduating_year: number | null;
    membership_type_used: RegistrationMembershipType;
    recognized_member: boolean;
    food_preference: string;
    accompanying_alumni_count: number;
    accompanying_family_count: number;
  } | null;
}

export interface EventAnalyticsMetrics {
  total_registrations: number;
  pre_registered_checked_in: number;
  on_spot_registrations: number;
  recognized_members_count: number;
  pre_registrations_imported: number;
  total_registration_fee: number;
  total_voluntary_contribution: number;
  total_collected: number;
  online_collected: number;
  cash_collected: number;
  total_accompanying_alumni: number;
  total_accompanying_family: number;
  total_headcount: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  amount?: number;
}

export interface CsvImportSummary {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  /** Pre-registrations matched to an association member during import */
  linkedMembersCount?: number;
  errors: string[];
}
