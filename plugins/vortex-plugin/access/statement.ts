import { createAccessControl } from "better-auth/plugins/access";

export const defaultStatements = {
  violation: ["create", "list", "update"],
} as const;

export const defaultAc = createAccessControl(defaultStatements);

export const adminAc = defaultAc.newRole({
  violation: ["create", "list", "update"],
});

export const userAc = defaultAc.newRole({
  violation: [],
});

export const defaultRoles = {
  admin: adminAc,
  user: userAc,
};
