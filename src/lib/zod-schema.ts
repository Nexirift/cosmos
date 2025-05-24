import {
  organization,
  user,
  userProfile,
  userVerification,
} from "@nexirift/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const insertUserProfileSchema = createInsertSchema(userProfile);
export type InsertUserProfileSchema = z.infer<typeof insertUserProfileSchema>;

export const insertUserVerificationSchema =
  createInsertSchema(userVerification);
export type InsertUserVerificationSchema = z.infer<
  typeof insertUserVerificationSchema
>;

export const selectUserSchema = createSelectSchema(user);
export type SelectUserSchema = z.infer<typeof selectUserSchema>;

export const selectOrganizationSchema = createSelectSchema(organization);
export type SelectOrganizationSchema = z.infer<typeof selectOrganizationSchema>;
