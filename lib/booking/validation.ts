import { z } from "zod";

export const confirmFormSchema = z.object({
  customer_name: z.string().min(2, "Please enter your full name"),
  customer_phone: z.string().min(6, "Please enter a valid phone number"),
  customer_email: z.string().email("Please enter a valid email address"),
  customer_password: z.string().min(6, "Password must be at least 6 characters"),
  notes: z.string().max(400, "Notes may not exceed 400 characters").optional(),
});

export type ConfirmFormValues = z.infer<typeof confirmFormSchema>;

export const bookingPayloadSchema = z.object({
  location_id: z.string().min(1),
  service_id: z.string().min(1),
  staff_id: z.string().min(1), // accepts UUID or "any"
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  customer_name: z.string().min(2),
  customer_phone: z.string().min(6),
  customer_email: z.string().optional().nullable(),
  notes: z.string().max(400).optional().nullable(),
});

export type BookingPayload = z.infer<typeof bookingPayloadSchema>;
