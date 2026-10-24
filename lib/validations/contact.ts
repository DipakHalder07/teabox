import { z } from "zod";

export const CONTACT_TOPICS = [
  { id: "order", label: "Order or delivery" },
  { id: "return", label: "Return, replacement or refund" },
  { id: "payment", label: "Payment" },
  { id: "product", label: "Product question" },
  { id: "wholesale", label: "Wholesale or corporate gifting" },
  { id: "other", label: "Something else" },
] as const;

export type ContactTopicId = (typeof CONTACT_TOPICS)[number]["id"];

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email address").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?91)?[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  orderNumber: z.string().trim().max(30).optional().or(z.literal("")),
  topic: z.enum(CONTACT_TOPICS.map((t) => t.id) as [ContactTopicId, ...ContactTopicId[]]),
  message: z.string().trim().min(10, "Please write a little more (at least 10 characters)").max(2000),
  // Hidden field real visitors never fill; bots usually do
  website: z.string().max(200).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
