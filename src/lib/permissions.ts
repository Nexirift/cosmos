import { headers } from "next/headers";
import { auth } from "./auth";
import { log, Logger } from "./logger";
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements as adminStatements,
  adminAc as adminAdminAc,
} from "better-auth/plugins/admin/access";
import {
  defaultStatements as organizationStatements,
  adminAc as organizationAdminAc,
} from "better-auth/plugins/organization/access";

const defaultStatements = {
  ...adminStatements,
  ...organizationStatements,
} as const;

export const permissions = {
  ...defaultStatements,
  moderation: ["view"],
} as const;

export const ac = createAccessControl(permissions);

export const admin = ac.newRole({
  moderation: ["view"],
  ...adminAdminAc.statements,
  ...organizationAdminAc.statements,
});

export const roles = { admin: admin };

export async function checkPermissions(
  permissions: {
    [key: string]: string[];
  },
  userId?: string,
) {
  try {
    var _userId = userId;

    if (!userId) {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session || !session.user || !session.session) return false;

      _userId = session.user.id;
    }

    const hasPermissions = await auth.api.userHasPermission({
      body: {
        permissions,
        userId: _userId,
      },
    });

    return hasPermissions.success;
  } catch (error) {
    log(`An error occured:\n${error}`, Logger.MODERATION_PROTECT);
    return false;
  }
}
