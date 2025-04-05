import { userProfile } from "@nexirift/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertUserProfileSchema = createInsertSchema(userProfile);

export const selectUserProfileSchema = createSelectSchema(userProfile);

export type InsertUserProfileSchema = typeof insertUserProfileSchema._type;

export type SelectUserProfileSchema = typeof selectUserProfileSchema._type;
