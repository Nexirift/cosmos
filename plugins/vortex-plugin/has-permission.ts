// https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/plugins/organization/has-permission.ts

import { defaultRoles } from "./access";
import { VortexOptions } from ".";

export const hasPermission = (input: {
  userId: string;
  role: string;
  options: VortexOptions;
  permission: {
    [key: string]: string[];
  };
}) => {
  const roles = input.role.split(",");
  const acRoles = input.options?.roles || defaultRoles;
  for (const role of roles) {
    const _role = acRoles[role as keyof typeof acRoles];
    const result = _role?.authorize(input.permission);
    if (result?.success) {
      return true;
    }
  }
  return false;
};
