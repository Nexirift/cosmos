import { userProfile, userVerification } from "@nexirift/db/schema";
import { createInsertSchema } from "drizzle-zod";

export const insertUserProfileSchema = createInsertSchema(userProfile);
export type InsertUserProfileSchema = typeof insertUserProfileSchema._type;

export const insertUserVerificationSchema =
  createInsertSchema(userVerification);
export type InsertUserVerificationSchema =
  typeof insertUserVerificationSchema._type;
