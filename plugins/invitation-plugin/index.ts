import {
  GenericEndpointContext,
  type BetterAuthPlugin,
  type User,
} from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  getSessionFromCtx,
} from "better-auth/api";
import { createAuthMiddleware } from "better-auth/plugins";
import { z } from "zod";
import { Invitation, schema } from "./schema";

export const invitation = () => {
  const ERROR_CODES = {
    UNAUTHORIZED: "You must be logged in to create an invitation",
    MAX_INVITATIONS_REACHED: "You have already created 3 invitations",
    INVITATION_FAILED: "Failed to create invitation",
    INVITE_CODE_REQUIRED: "You must provide an invite code for the alpha stage",
    INVALID_INVITE_CODE: "Invalid or already used invitation code",
    UPDATE_USER_FAILED: "Failed to update user with invitation",
    INVITATION_ALREADY_USED: "Invitation has been used by someone else",
    PROCESS_FAILED: "Failed to process invitation",
    INVITATION_NOT_FOUND: "Invitation not found",
    REVOKE_UNAUTHORIZED: "You can only revoke invitations you created",
    REVOKE_FAILED: "Failed to revoke invitation",
    INVITATION_ALREADY_USED_CANT_REVOKE:
      "Cannot revoke an invitation that has already been used",
  };

  const MAX_INVITATIONS = 3;
  const generateInviteCode = () =>
    `nexirift-${Math.random().toString(36).substring(2, 7)}-${Math.random().toString(36).substring(2, 7)}`;

  const validateSession = async (ctx: GenericEndpointContext) => {
    const session = await getSessionFromCtx(ctx);
    if (!session?.user) {
      throw new APIError("UNAUTHORIZED", {
        message: ERROR_CODES.UNAUTHORIZED,
      });
    }
    return session.user;
  };

  return {
    id: "invitation",
    schema,
    endpoints: {
      createInvitation: createAuthEndpoint(
        "/invitation/create",
        {
          method: "POST",
          metadata: {
            openapi: {
              summary: "Create invitation",
              description: "Create a new invitation code",
              responses: {
                200: {
                  description: "Success",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          invitation: {
                            $ref: "#/components/schemas/Invitation",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        async (ctx) => {
          const user = await validateSession(ctx);

          const invitations = await ctx.context.adapter.findMany<Invitation>({
            model: "invitation",
            where: [
              {
                field: "creatorId",
                operator: "eq",
                value: user.id,
              },
            ],
          });

          if (invitations.length >= MAX_INVITATIONS) {
            throw new APIError("FORBIDDEN", {
              message: ERROR_CODES.MAX_INVITATIONS_REACHED,
            });
          }

          const now = new Date();
          const invitation = await ctx.context.adapter.create<Invitation>({
            model: "invitation",
            data: {
              code: generateInviteCode(),
              creatorId: user.id,
              createdAt: now,
              updatedAt: now,
            },
          });

          if (!invitation) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: ERROR_CODES.INVITATION_FAILED,
            });
          }

          return ctx.json({ invitation });
        },
      ),
      revokeInvitation: createAuthEndpoint(
        "/invitation/revoke",
        {
          method: "POST",
          body: z.object({
            invitationId: z.string().min(1).max(255),
          }),
          metadata: {
            openapi: {
              summary: "Revoke invitation",
              description: "Revoke an unused invitation code that you created",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        invitationId: {
                          type: "string",
                          description: "ID of the invitation to revoke",
                        },
                      },
                      required: ["invitationId"],
                    },
                  },
                },
              },
              responses: {
                200: {
                  description: "Success",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          success: {
                            type: "boolean",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        async (ctx) => {
          const user = await validateSession(ctx);
          const { invitationId } = ctx.body;

          const invitation = await ctx.context.adapter.findOne<Invitation>({
            model: "invitation",
            where: [{ field: "id", operator: "eq", value: invitationId }],
          });

          if (!invitation) {
            throw new APIError("NOT_FOUND", {
              message: ERROR_CODES.INVITATION_NOT_FOUND,
            });
          }

          if (invitation.creatorId !== user.id) {
            throw new APIError("FORBIDDEN", {
              message: ERROR_CODES.REVOKE_UNAUTHORIZED,
            });
          }

          if (invitation.userId) {
            throw new APIError("BAD_REQUEST", {
              message: ERROR_CODES.INVITATION_ALREADY_USED_CANT_REVOKE,
            });
          }

          await ctx.context.adapter.delete({
            model: "invitation",
            where: [{ field: "id", operator: "eq", value: invitationId }],
          });

          const stillExists = await ctx.context.adapter.findOne<Invitation>({
            model: "invitation",
            where: [{ field: "id", operator: "eq", value: invitationId }],
          });

          if (stillExists) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: ERROR_CODES.REVOKE_FAILED,
            });
          }

          return ctx.json({ success: true });
        },
      ),
    },
    hooks: {
      before: [
        {
          matcher: (context) => context.path === "/sign-up/email",
          handler: createAuthMiddleware(async (ctx) => {
            if (!ctx.body?.invite) {
              throw new APIError("BAD_REQUEST", {
                message: ERROR_CODES.INVITE_CODE_REQUIRED,
              });
            }

            const inviteCode = ctx.body.invite.trim();
            const invitation = await ctx.context.adapter.findOne<Invitation>({
              model: "invitation",
              where: [{ field: "code", operator: "eq", value: inviteCode }],
            });

            if (!invitation || invitation.userId) {
              throw new APIError("BAD_REQUEST", {
                message: ERROR_CODES.INVALID_INVITE_CODE,
              });
            }

            ctx.body.fullInvitation = invitation;
            return { context: ctx };
          }),
        },
      ],
      after: [
        {
          matcher: (context) => context.path === "/sign-up/email",
          handler: createAuthMiddleware(async (ctx) => {
            try {
              const { email, fullInvitation } = ctx.body;
              const invitationId = fullInvitation.id;

              const user = await ctx.context.adapter.update<User>({
                model: "user",
                where: [{ field: "email", operator: "eq", value: email }],
                update: {
                  invitation: invitationId,
                },
              });

              if (!user) {
                throw new APIError("INTERNAL_SERVER_ERROR", {
                  message: ERROR_CODES.UPDATE_USER_FAILED,
                });
              }

              const invitation = await ctx.context.adapter.update<Invitation>({
                model: "invitation",
                where: [{ field: "id", operator: "eq", value: invitationId }],
                update: {
                  userId: user.id,
                  usedAt: new Date().toISOString(),
                },
              });

              if (!invitation) {
                throw new APIError("CONFLICT", {
                  message: ERROR_CODES.INVITATION_ALREADY_USED,
                });
              }
            } catch (error) {
              if (!(error instanceof APIError)) {
                throw new APIError("INTERNAL_SERVER_ERROR", {
                  message: ERROR_CODES.PROCESS_FAILED,
                  cause: error,
                });
              }
              throw error;
            }
          }),
        },
      ],
    },
    $ERROR_CODES: ERROR_CODES,
  } satisfies BetterAuthPlugin;
};
