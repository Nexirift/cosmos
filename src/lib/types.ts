/**
 * Common type definitions for the Cosmos application
 */

import { SettingKey } from "./defaults";

// Setting value types
export type SettingValue = string | number | boolean | string[] | number[];
export type SettingsRecord = Record<
  keyof typeof SettingKey,
  SettingValue
>;

// Database result types
export type DbResult = {
  key: string;
  value: string;
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
} | null | undefined;

// Auth provider types
export type AuthProvider =
  | "google"
  | "github"
  | "twitter"
  | "twitch"
  | "gitlab"
  | "discord";

// Email types
export interface EmailVariables {
  [key: string]: unknown;
  name?: string;
  url?: string;
  new_email?: string;
  whatEmail?: string;
}

// Redis cache entry
export interface CacheEntry<T> {
  value: T;
  expires: number; // Unix timestamp
}

// User context
export interface UserContext {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  roles?: string[];
  permissions?: string[];
}

// Plugin types
export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  source: "auth" | "nexirift" | "custom";
}

// API Error response
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
}

// Request context
export interface RequestContext {
  user?: UserContext;
  settings?: Partial<SettingsRecord>;
  path: string;
  method: string;
  ip?: string;
  userAgent?: string;
}
