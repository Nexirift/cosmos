import { AuthPluginSchema } from "better-auth";

export const schema = {
  user: {
    fields: {
      birthday: {
        type: "string",
        required: false,
        unique: false,
        references: undefined,
        returned: true,
      },
    },
  },
} satisfies AuthPluginSchema;
