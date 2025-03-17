import { generateId } from "better-auth";
import { z } from "zod";

export const violationSchema = z.object({
  id: z.string().default(generateId),
  content: z.string(),
  publicComment: z.string().optional(),
  internalNote: z.string().optional(),
  severity: z.number(),
  applicableRules: z.array(z.string()).default([]).or(z.string().default("[]")),
  overturned: z.boolean().optional(),
  moderatorId: z.string().optional(),
  userId: z.string().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  lastUpdatedBy: z.string(),
  updatedAt: z.date(),
  am_status: z.string().optional(),
});

export type Violation = z.infer<typeof violationSchema>;

export const disputeSchema = z.object({
  id: z.string().default(generateId),
  violationId: z.string(),
  userId: z.string(),
  reason: z.string(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Dispute = z.infer<typeof disputeSchema>;
