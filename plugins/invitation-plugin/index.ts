import type { BetterAuthPlugin, User } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { createAuthMiddleware } from "better-auth/plugins";
import { Invitation, schema } from "./schema";

export const invitation = (): BetterAuthPlugin => {
  const ERROR_CODES = {
    UNAUTHORIZED: "You must be logged in to create an invitation",
    MAX_INVITATIONS_REACHED: "You have already created 3 invitations",
    INVITATION_FAILED: "Failed to create invitation",
    INVITE_CODE_REQUIRED: "You must provide an invite code for the alpha stage",
    INVALID_INVITE_CODE: "Invalid or already used invitation code",
    UPDATE_USER_FAILED: "Failed to update user with invitation",
    INVITATION_ALREADY_USED: "Invitation has been used by someone else",
    PROCESS_FAILED: "Failed to process invitation",
  };

  return {
    id: "invitation",
    schema: schema,
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
          if (!ctx.context.session?.session.id) {
            ctx.context.logger?.error(
              "Unauthorized invitation creation attempt",
            );
            throw new APIError("UNAUTHORIZED", {
              message: ERROR_CODES.UNAUTHORIZED,
            });
          }

          const invitations = await ctx.context.adapter.findMany<Invitation>({
            model: "invitation",
            where: [
              {
                field: "userId",
                operator: "eq",
                value: ctx.context.session.session.id,
              },
            ],
          });

          if (invitations.length >= 3) {
            ctx.context.logger?.error("Max invitations reached", {
              userId: ctx.context.session.session.id,
              count: invitations.length,
            });
            throw new APIError("FORBIDDEN", {
              message: ERROR_CODES.MAX_INVITATIONS_REACHED,
            });
          }

          const invitation = await ctx.context.adapter.create<Invitation>({
            model: "invitation",
            data: {
              code: Math.random().toString(36).substring(2, 15),
              creatorId: ctx.context.session.session.id,
              userId: ctx.context.session.session.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          });

          if (!invitation) {
            ctx.context.logger?.error("Failed to create invitation");
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: ERROR_CODES.INVITATION_FAILED,
            });
          }

          return ctx.json({
            invitation,
          });
        },
      ),
    },
    hooks: {
      before: [
        {
          matcher: (context) => context.path === "/sign-up/email",
          handler: createAuthMiddleware(async (ctx) => {
            if (!ctx.body?.invite) {
              ctx.context.logger?.error("Missing invite code during signup");
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
              ctx.context.logger?.error("Invalid or used invite code", {
                inviteCode,
              });
              throw new APIError("BAD_REQUEST", {
                message: ERROR_CODES.INVALID_INVITE_CODE,
              });
            }

            // Store invitation data for the after hook
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
              // Associate invitation with user in a transaction if possible
              const user = await ctx.context.adapter.update<User>({
                model: "user",
                where: [
                  { field: "email", operator: "eq", value: ctx.body.email },
                ],
                update: {
                  invitation: ctx.body.fullInvitation.id,
                },
              });

              if (!user) {
                ctx.context.logger?.error(
                  "Failed to update user with invitation",
                  {
                    email: ctx.body.email,
                    invitationId: ctx.body.fullInvitation.id,
                  },
                );
                throw new APIError("INTERNAL_SERVER_ERROR", {
                  message: ERROR_CODES.UPDATE_USER_FAILED,
                });
              }

              // Mark invitation as used by setting the userId
              const invitation = await ctx.context.adapter.update<Invitation>({
                model: "invitation",
                where: [
                  {
                    field: "id",
                    operator: "eq",
                    value: ctx.body.fullInvitation.id,
                  },
                ],
                update: {
                  userId: user.id,
                  usedAt: new Date().toISOString(),
                },
              });

              if (!invitation) {
                ctx.context.logger?.error("Invitation update failed", {
                  invitationId: ctx.body.fullInvitation.id,
                });
                throw new APIError("CONFLICT", {
                  message: ERROR_CODES.INVITATION_ALREADY_USED,
                });
              }
            } catch (error) {
              // If this is not already an APIError, wrap it
              if (!(error instanceof APIError)) {
                ctx.context.logger?.error("Error processing invitation", {
                  error,
                });
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
  };
};
