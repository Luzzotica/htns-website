import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type EmailFormData = z.infer<typeof emailSchema>;

export const authorRequestSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  bookTopic: z
    .string()
    .min(1, "Please tell us what topic you'd like to write about"),
  targetAudience: z
    .string()
    .min(1, "Please describe who your book is for"),
  qualifications: z
    .string()
    .min(1, "Please share what makes you qualified to write about this topic"),
  previouslyPublished: z.enum(["yes", "no", "currently-writing"], {
    error: "Please select an option",
  }),
  additionalInfo: z.string().optional(),
});

export type AuthorRequestFormData = z.infer<typeof authorRequestSchema>;
