import {
  AuthPluginSchema,
  generateId,
  GenericEndpointContext,
  Session,
  Where,
  type BetterAuthPlugin,
} from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { UserWithRole } from "better-auth/plugins";
import {
  AccessControl,
  Statements as BAS,
  Role,
} from "better-auth/plugins/access";
import { z } from "zod";
import { defaultStatements } from "./access/statement";
import { hasPermission } from "./has-permission";
import { Dispute, Violation } from "./schema";
import { VORTEX_ERROR_CODES } from "./error-codes";

const paginationQuerySchema = {
  limit: z
    .union([
      z.string().regex(/^\d+$/, "Must be a number"),
      z.number().int().positive(),
    ])
    .optional()
    .describe("Number of items to return"),
  offset: z
    .union([
      z.string().regex(/^\d+$/, "Must be a number"),
      z.number().int().nonnegative(),
    ])
    .optional()
    .describe("Starting index for pagination"),
  sortBy: z.string().optional().describe("Field to sort by"),
  sortDirection: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction (asc or desc)"),
};

const parsePaginationParams = (
  query: Record<string, string | number | boolean | undefined>,
) => {
  return {
    limit: query.limit ? Number(query.limit) : undefined,
    offset: query.offset ? Number(query.offset) : undefined,
    sortBy: query.sortBy
      ? {
          field: query.sortBy as string,
          direction: (query.sortDirection as "asc" | "desc") || "asc",
        }
      : undefined,
  };
};

const handleApiError = (error: unknown, defaultMessage: string) => {
  if (error instanceof APIError) {
    throw error;
  }
  console.error(`[# Vortex Plugin]: ${defaultMessage}`, error);
  throw new APIError("INTERNAL_SERVER_ERROR", { message: defaultMessage });
};

/**
 * Configuration options for the vortex plugin
 */
export interface VortexOptions {
  /**
   * Configure the roles and permissions for the
   * organization plugin.
   */
  ac?: AccessControl;

  /**
   * Custom permissions for roles.
   */
  roles?: {
    [key in string]?: Role<BAS>;
  };

  schema?: {
    violation?: {
      modelName: string;
    };
    dispute?: {
      modelName: string;
    };
  };
}

export const vortex = <O extends VortexOptions>(options?: O) => {
  const opts = {
    defaultRole: "user",
    adminRoles: ["admin"],
    ...options,
  };

  type DefaultStatements = typeof defaultStatements;
  type Statements = [O["ac"]] extends [AccessControl<infer S>]
    ? S
    : DefaultStatements;

  /**
   * Middleware to handle authentication for vortex endpoints
   */
  const vortexMiddleware = createAuthMiddleware(async (ctx) => {
    const session = await getSessionFromCtx(ctx);
    return {
      session,
    } as {
      session: {
        user: UserWithRole;
        session: Session;
      };
    };
  });

  /**
   * Helper function to check if user has required permissions
   */
  const checkPermission = (
    ctx: GenericEndpointContext,
    permission: Record<string, string[]>,
  ): boolean => {
    if (!ctx.context.session) {
      throw new APIError("UNAUTHORIZED", {
        message: VORTEX_ERROR_CODES.UNAUTHORIZED,
      });
    }

    return hasPermission({
      userId: ctx.context.session.user.id,
      role: ctx.context.session.user.role ?? opts.defaultRole,
      options: opts,
      permission,
    });
  };

  const schema = {
    violation: {
      modelName: opts.schema?.violation?.modelName,
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
        applicableRules: {
          type: "string",
          required: true,
          defaultValue: "[]",
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
        amStatus: {
          type: "string",
          required: false,
          defaultValue: null,
        },
        amMetadata: {
          type: "string",
          required: false,
        },
      },
    },
    dispute: {
      modelName: opts.schema?.dispute?.modelName,
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

  return {
    id: "vortex",
    schema,
    endpoints: {
      userHasPermission: createAuthEndpoint(
        "/vortex/has-permission",
        {
          method: "POST",
          body: z.object({
            permission: z.record(z.string(), z.array(z.string())),
            userId: z.string().optional(),
            role: z.string().optional(),
          }),
          metadata: {
            openapi: {
              description: "Check if the user has permission",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        permission: {
                          type: "object",
                          description: "The permission to check",
                        },
                        userId: {
                          type: "string",
                          description:
                            "Optional user ID to check permissions for",
                        },
                        role: {
                          type: "string",
                          description: "Optional role to check permissions for",
                        },
                      },
                      required: ["permission"],
                    },
                  },
                },
              },
              responses: {
                "200": {
                  description: "Success",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          error: {
                            type: "string",
                            nullable: true,
                          },
                          success: {
                            type: "boolean",
                          },
                        },
                        required: ["success"],
                      },
                    },
                  },
                },
              },
            },
            $Infer: {
              body: {} as {
                permission: {
                  // @ts-expect-error this
                  [key in keyof Statements]?: Array<Statements[key][number]>;
                };
                userId?: string;
                role?: string;
              },
            },
          },
        },
        async (ctx) => {
          if (
            !ctx.body.permission ||
            Object.keys(ctx.body.permission).length > 1
          ) {
            throw new APIError("BAD_REQUEST", {
              message: VORTEX_ERROR_CODES.INVALID_PERMISSION_CHECK,
              code: "INVALID_PERMISSION_CHECK",
            });
          }

          const session = ctx.context.session;

          // Verify authentication when necessary
          if (
            !session &&
            (ctx.request || ctx.headers) &&
            !ctx.body.userId &&
            !ctx.body.role
          ) {
            throw new APIError("UNAUTHORIZED", {
              message: VORTEX_ERROR_CODES.UNAUTHORIZED,
            });
          }

          // Get user data from session, ID lookup, or role
          const user =
            session?.user ||
            ((await ctx.context.internalAdapter.findUserById(
              ctx.body.userId as string,
            )) as { role?: string; id: string }) ||
            (ctx.body.role ? { id: "", role: ctx.body.role } : null);

          if (!user) {
            throw new APIError("BAD_REQUEST", {
              message: VORTEX_ERROR_CODES.USER_NOT_FOUND,
              code: "USER_NOT_FOUND",
            });
          }

          const result = hasPermission({
            userId: user.id,
            role: user.role,
            options: opts as VortexOptions,
            permission: ctx.body.permission as Record<string, string[]>,
          });

          return ctx.json({
            error: null,
            success: result,
          });
        },
      ),

      createViolation: createAuthEndpoint(
        "/vortex/create-violation",
        {
          method: "POST",
          use: [vortexMiddleware],
          body: z.object({
            userId: z.string().describe("Target user ID"),
            content: z.string().describe("Violation content"),
            severity: z
              .number()
              .int()
              .min(1)
              .max(10)
              .describe("Violation severity level (1-10)"),
            applicableRules: z
              .array(z.string())
              .describe("Rules that apply to this violation"),
            publicComment: z
              .string()
              .optional()
              .describe("Public facing comment"),
            internalNote: z
              .string()
              .optional()
              .describe("Internal note visible only to moderators"),
            expiresAt: z
              .date()
              .optional()
              .describe("When this violation expires"),
          }),
        },
        async (ctx) => {
          try {
            if (!checkPermission(ctx, { violation: ["create"] })) {
              throw new APIError("FORBIDDEN", {
                message: VORTEX_ERROR_CODES.FORBIDDEN,
              });
            }

            const now = new Date();
            // Default expiration is 30 days from creation
            const defaultExpiration = now.getTime() + 1000 * 60 * 60 * 24 * 30;

            const violation = await ctx.context.adapter.create<Violation>({
              model: "violation",
              data: {
                id: generateId(),
                content: ctx.body.content,
                publicComment: ctx.body.publicComment,
                internalNote: ctx.body.internalNote,
                severity: ctx.body.severity,
                moderatorId: ctx.context.session.user.id,
                userId: ctx.body.userId,
                applicableRules: JSON.stringify(ctx.body.applicableRules),
                overturned: false,
                expiresAt: new Date(ctx.body.expiresAt ?? defaultExpiration),
                createdAt: now,
                lastUpdatedBy: ctx.context.session.user.id,
                updatedAt: now,
              },
            });

            const returnViolation = {
              ...violation,
              applicableRules: JSON.parse(violation?.applicableRules as string),
            };

            return returnViolation;
          } catch (error) {
            handleApiError(error, VORTEX_ERROR_CODES.VIOLATION_CREATE_FAILED);
          }
        },
      ),
      listViolations: createAuthEndpoint(
        "/vortex/list-violations",
        {
          method: "GET",
          use: [vortexMiddleware],
          query: z.object({
            userId: z.string().optional().describe("Filter by user ID"),
            moderatorId: z
              .string()
              .optional()
              .describe("Filter by moderator ID"),
            overturned: z
              .boolean()
              .optional()
              .describe("Filter by overturned status"),
            ...paginationQuerySchema,
          }),
        },
        async (ctx) => {
          try {
            if (!checkPermission(ctx, { violation: ["list"] })) {
              throw new APIError("FORBIDDEN", {
                message: VORTEX_ERROR_CODES.FORBIDDEN,
              });
            }

            const where: Where[] = [];
            const { userId, moderatorId, overturned } = ctx.query;
            const { limit, offset, sortBy } = parsePaginationParams(ctx.query);

            // Build query filters
            if (userId) {
              where.push({
                field: "userId",
                operator: "eq",
                value: userId,
              });
            }

            if (moderatorId) {
              where.push({
                field: "moderatorId",
                operator: "eq",
                value: moderatorId,
              });
            }

            if (overturned !== undefined) {
              where.push({
                field: "overturned",
                operator: "eq",
                value: overturned,
              });
            }
            // Get violations with pagination and sorting
            const violations = await ctx.context.adapter.findMany<Violation>({
              model: "violation",
              where,
              limit,
              offset,
              sortBy,
            });

            // Parse applicableRules for each violation
            const parsedViolations = violations.map((violation) => ({
              ...violation,
              applicableRules: JSON.parse(violation.applicableRules as string),
            }));

            const total = await ctx.context.adapter.count({
              model: "violation",
              where,
            });

            return ctx.json({
              violations: parsedViolations,
              total,
              limit,
              offset,
            });
          } catch (error) {
            handleApiError(error, VORTEX_ERROR_CODES.VIOLATION_LIST_FAILED);
          }
        },
      ),
      updateViolation: createAuthEndpoint(
        "/vortex/update-violation",
        {
          method: "POST",
          use: [vortexMiddleware],
          body: z.object({
            id: z.string().describe("Violation ID to update"),
            content: z
              .string()
              .optional()
              .describe("Updated violation content"),
            publicComment: z
              .string()
              .optional()
              .describe("Updated public facing comment"),
            internalNote: z
              .string()
              .optional()
              .describe("Updated internal note"),
            severity: z
              .number()
              .int()
              .min(1)
              .max(10)
              .optional()
              .describe("Updated violation severity level (1-10)"),
            overturned: z.boolean().optional().describe("Overturned status"),
            expiresAt: z.date().optional().describe("Updated expiration date"),
          }),
        },
        async (ctx) => {
          try {
            if (!checkPermission(ctx, { violation: ["update"] })) {
              throw new APIError("FORBIDDEN", {
                message: VORTEX_ERROR_CODES.FORBIDDEN,
              });
            }

            // First check if the violation exists
            const existingViolation =
              await ctx.context.adapter.findOne<Violation>({
                model: "violation",
                where: [
                  {
                    field: "id",
                    operator: "eq",
                    value: ctx.body.id,
                  },
                  {
                    field: "amStatus",
                    operator: "eq",
                    value: "approved",
                  },
                ],
              });

            if (!existingViolation) {
              throw new APIError("NOT_FOUND", {
                message: VORTEX_ERROR_CODES.VIOLATION_NOT_FOUND,
                code: "VIOLATION_NOT_FOUND",
              });
            }

            // Update the violation
            const updatedViolation =
              await ctx.context.adapter.update<Violation>({
                model: "violation",
                where: [
                  {
                    field: "id",
                    operator: "eq",
                    value: ctx.body.id,
                  },
                ],
                update: {
                  ...ctx.body,
                  lastUpdatedBy: ctx.context.session.user.id,
                  updatedAt: new Date(),
                },
              });

            const returnViolation = {
              ...updatedViolation,
              applicableRules: JSON.parse(
                updatedViolation?.applicableRules as string,
              ),
            };

            return returnViolation;
          } catch (error) {
            handleApiError(error, VORTEX_ERROR_CODES.VIOLATION_UPDATE_FAILED);
          }
        },
      ),
      myViolations: createAuthEndpoint(
        "/vortex/my-violations",
        {
          method: "GET",
          use: [vortexMiddleware],
          query: z.object(paginationQuerySchema).optional(),
        },
        async (ctx) => {
          try {
            if (!ctx.context.session) {
              throw new APIError("UNAUTHORIZED", {
                message: VORTEX_ERROR_CODES.UNAUTHORIZED,
              });
            }

            const userId = ctx.context.session.user.id;

            const { limit, offset, sortBy } = parsePaginationParams(ctx.query!);

            // Build query filters
            const where: Where[] = [
              {
                field: "userId",
                operator: "eq",
                value: userId,
              },
            ];

            // Get violations with pagination and sorting
            const violations = await ctx.context.adapter.findMany<Violation>({
              model: "violation",
              where,
              limit,
              offset,
              sortBy,
            });
            // Filter out internal fields and parse applicable rules
            const filteredViolations = violations.map((violation) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { internalNote, lastUpdatedBy, moderatorId, ...rest } =
                violation;
              return {
                ...rest,
                applicableRules: JSON.parse(
                  violation.applicableRules as string,
                ),
              };
            }) as Violation[];

            const total = await ctx.context.adapter.count({
              model: "violation",
              where,
            });

            return ctx.json({
              violations: filteredViolations,
              total,
              limit,
              offset,
            });
          } catch (error) {
            console.log(error);
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: VORTEX_ERROR_CODES.VIOLATION_LIST_FAILED,
            });
          }
        },
      ),
      disputeViolation: createAuthEndpoint(
        "/vortex/dispute-violation",
        {
          method: "POST",
          use: [vortexMiddleware],
          body: z.object({
            violationId: z.string().describe("ID of the violation to dispute"),
            reason: z.string().min(10).describe("Reason for the dispute"),
          }),
          metadata: {
            openapi: {
              description: "File a dispute against a violation",
              responses: {
                "200": {
                  description: "Dispute created successfully",
                },
                "400": {
                  description: "Violation already disputed or invalid request",
                },
                "404": {
                  description: "Violation not found",
                },
              },
            },
          },
        },
        async (ctx) => {
          try {
            if (!ctx.context.session) {
              throw new APIError("UNAUTHORIZED", {
                message: VORTEX_ERROR_CODES.UNAUTHORIZED,
              });
            }

            // First check if the violation exists and belongs to the user
            const violation = await ctx.context.adapter.findOne<Violation>({
              model: "violation",
              where: [
                {
                  field: "id",
                  operator: "eq",
                  value: ctx.body.violationId,
                },
                {
                  field: "userId",
                  operator: "eq",
                  value: ctx.context.session.user.id,
                },
                {
                  field: "amStatus",
                  operator: "eq",
                  value: "approved",
                },
              ],
            });

            if (!violation) {
              throw new APIError("NOT_FOUND", {
                message: VORTEX_ERROR_CODES.VIOLATION_NOT_FOUND,
                code: "VIOLATION_NOT_FOUND",
              });
            }

            // Don't allow disputing overturned violations
            if (violation.overturned) {
              throw new APIError("BAD_REQUEST", {
                message: VORTEX_ERROR_CODES.DISPUTE_ALREADY_OVERTURNED,
                code: "DISPUTE_ALREADY_OVERTURNED",
              });
            }

            // Check if there's already a dispute for this violation
            const existingDispute = await ctx.context.adapter.findOne<Dispute>({
              model: "dispute",
              where: [
                {
                  field: "violationId",
                  operator: "eq",
                  value: ctx.body.violationId,
                },
              ],
            });

            if (existingDispute) {
              throw new APIError("BAD_REQUEST", {
                message: VORTEX_ERROR_CODES.DISPUTE_ALREADY_EXISTS,
                code: "DISPUTE_ALREADY_EXISTS",
              });
            }

            const now = new Date();

            // Create the dispute
            const dispute = await ctx.context.adapter.create<Dispute>({
              model: "dispute",
              data: {
                id: generateId(),
                violationId: ctx.body.violationId,
                userId: ctx.context.session.user.id,
                reason: ctx.body.reason,
                status: "pending",
                createdAt: now,
                updatedAt: now,
              },
            });

            return dispute;
          } catch (error) {
            handleApiError(error, VORTEX_ERROR_CODES.DISPUTE_CREATE_FAILED);
          }
        },
      ),

      listDisputes: createAuthEndpoint(
        "/vortex/list-disputes",
        {
          method: "GET",
          use: [vortexMiddleware],
          query: z
            .object({
              status: z
                .enum(["pending", "approved", "rejected"])
                .optional()
                .describe("Filter by status"),
              userId: z.string().optional().describe("Filter by user ID"),
              violationId: z
                .string()
                .optional()
                .describe("Filter by violation ID"),
              ...paginationQuerySchema,
            })
            .optional(),
          metadata: {
            openapi: {
              description:
                "List and filter disputes (requires manage permission)",
            },
          },
        },
        async (ctx) => {
          try {
            if (!checkPermission(ctx, { violation: ["manage"] })) {
              throw new APIError("FORBIDDEN", {
                message: VORTEX_ERROR_CODES.FORBIDDEN,
              });
            }

            const where: Where[] = [];

            const status = ctx.query?.status;
            const userId = ctx.query?.userId;
            const violationId = ctx.query?.violationId;

            const { limit, offset, sortBy } = parsePaginationParams(ctx.query!);

            // Build query filters
            if (status) {
              where.push({
                field: "status",
                operator: "eq",
                value: status,
              });
            }

            if (userId) {
              where.push({
                field: "userId",
                operator: "eq",
                value: userId,
              });
            }

            if (violationId) {
              where.push({
                field: "violationId",
                operator: "eq",
                value: violationId,
              });
            }
            const disputes = await ctx.context.adapter.findMany<Dispute>({
              model: "dispute",
              where,
              limit,
              offset,
              sortBy,
            });

            // Get total count for pagination
            const total = await ctx.context.adapter.count({
              model: "dispute",
              where,
            });

            return ctx.json({
              disputes,
              total,
              limit,
              offset,
            });
          } catch (error) {
            handleApiError(error, VORTEX_ERROR_CODES.DISPUTE_LIST_FAILED);
          }
        },
      ),
      resolveDispute: createAuthEndpoint(
        "/vortex/resolve-dispute",
        {
          method: "POST",
          use: [vortexMiddleware],
          body: z.object({
            disputeId: z.string().describe("ID of the dispute to resolve"),
            status: z
              .enum(["approved", "rejected"])
              .describe("Resolution status"),
            justification: z
              .string()
              .min(5)
              .optional()
              .describe("Optional justification about the resolution"),
          }),
          metadata: {
            openapi: {
              description: "Resolve a dispute (requires manage permission)",
              responses: {
                "200": {
                  description: "Dispute resolved successfully",
                },
                "403": {
                  description: "Insufficient permissions",
                },
                "404": {
                  description: "Dispute not found",
                },
              },
            },
          },
        },
        async (ctx) => {
          try {
            if (!checkPermission(ctx, { violation: ["manage"] })) {
              throw new APIError("FORBIDDEN", {
                message: VORTEX_ERROR_CODES.FORBIDDEN,
              });
            }
            // First check if the dispute exists
            const dispute = await ctx.context.adapter.findOne<Dispute>({
              model: "dispute",
              where: [
                {
                  field: "id",
                  operator: "eq",
                  value: ctx.body.disputeId,
                },
              ],
            });

            if (!dispute) {
              throw new APIError("NOT_FOUND", {
                message: VORTEX_ERROR_CODES.DISPUTE_NOT_FOUND,
                code: "DISPUTE_NOT_FOUND",
              });
            }

            // Don't allow resolving already resolved disputes
            if (dispute.status !== "pending") {
              throw new APIError("BAD_REQUEST", {
                message:
                  dispute.status === "approved"
                    ? VORTEX_ERROR_CODES.DISPUTE_STATUS_APPROVED
                    : VORTEX_ERROR_CODES.DISPUTE_STATUS_REJECTED,
                code:
                  dispute.status === "approved"
                    ? "DISPUTE_STATUS_APPROVED"
                    : "DISPUTE_STATUS_REJECTED",
              });
            }

            const now = new Date();

            // Update the dispute with resolution details
            const updatedDispute = await ctx.context.adapter.update<Dispute>({
              model: "dispute",
              where: [
                {
                  field: "id",
                  operator: "eq",
                  value: ctx.body.disputeId,
                },
              ],
              update: {
                status: ctx.body.status,
                justification: ctx.body.justification,
                reviewedBy: ctx.context.session.user.id,
                reviewedAt: now,
                updatedAt: now,
              },
            });

            // Update the associated violation's overturned status
            await ctx.context.adapter.update<Violation>({
              model: "violation",
              where: [
                {
                  field: "id",
                  operator: "eq",
                  value: dispute.violationId,
                },
              ],
              update: {
                overturned: ctx.body.status === "approved",
                lastUpdatedBy: ctx.context.session.user.id,
                updatedAt: now,
              },
            });

            return updatedDispute;
          } catch (error) {
            handleApiError(error, VORTEX_ERROR_CODES.DISPUTE_UPDATE_FAILED);
          }
        },
      ),

      myDisputes: createAuthEndpoint(
        "/vortex/my-disputes",
        {
          method: "GET",
          use: [vortexMiddleware],
          query: z
            .object({
              status: z
                .enum(["pending", "approved", "rejected"])
                .optional()
                .describe("Filter by status"),
              ...paginationQuerySchema,
            })
            .optional(),
          metadata: {
            openapi: {
              description: "List current user's own disputes",
            },
          },
        },
        async (ctx) => {
          try {
            if (!ctx.context.session) {
              throw new APIError("UNAUTHORIZED", {
                message: VORTEX_ERROR_CODES.UNAUTHORIZED,
              });
            }

            const userId = ctx.context.session.user.id;
            const status = ctx.query?.status;
            const { limit, offset, sortBy } = parsePaginationParams(ctx.query!);

            const where: Where[] = [
              {
                field: "userId",
                operator: "eq",
                value: userId,
              },
            ];

            if (status) {
              where.push({
                field: "status",
                operator: "eq",
                value: status,
              });
            }
            // Get disputes with pagination and sorting
            const disputes = await ctx.context.adapter.findMany<Dispute>({
              model: "dispute",
              where,
              limit,
              offset,
              sortBy,
            });

            // For each dispute, fetch the associated violation details
            const disputesWithViolations = await Promise.all(
              disputes.map(async (dispute) => {
                const violation = await ctx.context.adapter.findOne<Violation>({
                  model: "violation",
                  where: [
                    {
                      field: "id",
                      operator: "eq",
                      value: dispute.violationId,
                    },
                    {
                      field: "amStatus",
                      operator: "eq",
                      value: "approved",
                    },
                  ],
                });
                return {
                  ...dispute,
                  violation: violation
                    ? {
                        id: violation.id,
                        content: violation.content,
                        severity: violation.severity,
                        overturned: violation.overturned,
                        createdAt: violation.createdAt,
                        expiresAt: violation.expiresAt,
                        publicComment: violation.publicComment,
                        applicableRules: JSON.parse(
                          violation.applicableRules as string,
                        ),
                      }
                    : null,
                };
              }),
            );

            const total = await ctx.context.adapter.count({
              model: "dispute",
              where,
            });

            return ctx.json({
              disputes: disputesWithViolations,
              total,
              limit,
              offset,
            });
          } catch (error) {
            handleApiError(error, VORTEX_ERROR_CODES.DISPUTE_LIST_FAILED);
          }
        },
      ),
    },
  } satisfies BetterAuthPlugin;
};
