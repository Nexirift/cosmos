import { AuthPluginSchema } from "better-auth";

export type Invitation = {
  id?: string;
  code: string;
  creatorId: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const schema = {
  user: {
    fields: {
      invitation: {
        type: "string",
        required: false,
        unique: true,
        returned: true,
      },
    },
  },
  invitation: {
    fields: {
      code: {
        type: "string",
        required: true,
        unique: true,
      },
      creatorId: {
        type: "string",
        required: true,
        references: {
          model: "user",
          field: "id",
          onDelete: "cascade",
        },
      },
      userId: {
        type: "string",
        required: false,
        references: {
          model: "user",
          field: "id",
          onDelete: "cascade",
        },
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
