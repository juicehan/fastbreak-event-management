import { z } from "zod";

// Sport types enum
export const SPORT_TYPES = [
  "Basketball",
  "Football",
  "Soccer",
  "Baseball",
  "Tennis",
  "Golf",
  "Hockey",
  "Volleyball",
  "Swimming",
  "Track & Field",
  "Other",
] as const;

export type SportType = (typeof SPORT_TYPES)[number];

// Database types
export type Event = {
  id: string;
  user_id: string;
  name: string;
  sport_type: string;
  date_time: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Venue = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
};

export type EventVenue = {
  id: string;
  event_id: string;
  venue_id: string;
};

// Event with venues (joined)
export type EventWithVenues = Event & {
  venues: Venue[];
};

// Zod schemas for validation
export const createEventSchema = z.object({
  name: z
    .string()
    .min(1, "Event name is required")
    .max(255, "Event name must be less than 255 characters"),
  sport_type: z
    .string()
    .min(1, "Sport type is required"),
  date_time: z
    .string()
    .min(1, "Date and time is required"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),
  venue_ids: z
    .array(z.string().uuid())
    .min(1, "At least one venue is required"),
});

export const updateEventSchema = createEventSchema.partial().extend({
  id: z.string().uuid("Invalid event ID"),
});

export const createVenueSchema = z.object({
  name: z
    .string()
    .min(1, "Venue name is required")
    .max(255, "Venue name must be less than 255 characters"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address must be less than 500 characters"),
});

export const updateVenueSchema = createVenueSchema.extend({
  id: z.string().uuid("Invalid venue ID"),
});

export const searchEventsSchema = z.object({
  query: z.string().optional(),
  sport_type: z.string().optional(),
});

// Infer types from schemas
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type SearchEventsInput = z.infer<typeof searchEventsSchema>;