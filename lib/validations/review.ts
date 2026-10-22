import { z } from "zod";

export const productReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  author: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  rating: z.number().min(1).max(5),
  title: z.string().min(3, "Please enter a brief title for your review"),
  body: z.string().min(10, "Please share at least 10 characters describing your tea experience"),
});

export type ProductReviewInput = z.infer<typeof productReviewSchema>;
