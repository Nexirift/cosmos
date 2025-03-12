import { AuthPluginSchema, generateId } from "better-auth";
import { z } from "zod";

export const violationSchema = z.object({
  id: z.string().default(generateId),
  content: z.string(),
  publicComment: z.string().optional(),
  internalNote: z.string().optional(),
  severity: z.number(),
  overturned: z.boolean().optional(),
  moderatorId: z.string().optional(),
  userId: z.string().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date(),
  lastUpdatedBy: z.string(),
  updatedAt: z.date(),
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

export const schema = {
  violation: {
    fields: {
      content: {
        // this is json
        type: "string",
        required: true,
        unique: false,
      },
      publicComment: {
        type: "string",
        required: false,
      },
      internalNote: {
        type: "string",
        required: false,
      },
      severity: {
        type: "number",
        required: true,
      },
      overturned: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      moderatorId: {
        type: "string",
        required: false,
        references: {
          model: "user",
          field: "id",
          onDelete: "set null",
        },
      },
      userId: {
        type: "string",
        required: false,
        references: {
          model: "user",
          field: "id",
          onDelete: "set null",
        },
      },
      expiresAt: {
        type: "date",
        required: false,
      },
      createdAt: {
        type: "date",
        required: true,
      },
      lastUpdatedBy: {
        type: "string",
        required: false,
        references: {
          model: "user",
          field: "id",
          onDelete: "set null",
        },
      },
      updatedAt: {
        type: "date",
        required: true,
      },
    },
  },
  dispute: {
    fields: {
      violationId: {
        type: "string",
        required: true,
        references: {
          model: "violation",
          field: "id",
          onDelete: "cascade",
        },
      },
      userId: {
        type: "string",
        required: true,
        references: {
          model: "user",
          field: "id",
          onDelete: "cascade",
        },
      },
      reason: {
        type: "string",
        required: true,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: "pending",
      },
      justification: {
        type: "string",
        required: false,
      },
      reviewedBy: {
        type: "string",
        required: false,
        references: {
          model: "user",
          field: "id",
          onDelete: "set null",
        },
      },
      reviewedAt: {
        type: "date",
        required: false,
      },
      createdAt: {
        type: "date",
        required: true,
      },
      updatedAt: {
        type: "date",
        required: true,
      },
    },
  },
} satisfies AuthPluginSchema;
