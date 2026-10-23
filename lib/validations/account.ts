import { z } from "zod";

export const customerLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const customerRegisterSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number")
    .optional()
    .or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const emailOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const emailOtpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{4}$/, "Verification code must be 4 digits"),
});

export const fastrrOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(10),
  otp: z.string().regex(/^\d{4}$/, "OTP must be 4 digits"),
});
