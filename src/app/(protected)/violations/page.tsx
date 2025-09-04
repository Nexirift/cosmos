"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Dispute, Violation } from "@nexirift/better-auth-plugins";
import { useCallback, useEffect, useState } from "react";

// Types
type ExtendedViolation = Violation & {
  expired: boolean;
  dispute: Dispute | null;
};

type Content = {
  service: string;
  content: Array<{
    type: string;
    id?: string;
    chatId?: string;
    messageId?: string;
    boardId?: string;
    cardId?: string;
  }>;
};
// Interface for service item mappings
interface ServiceItemMapping {
  name: string;
  url?: string;
}

// Interface for service mappings
interface ServiceMapping {
  service: string;
  [key: string]: string | ServiceItemMapping;
}

// Service display mappings
const SERVICE_MAP: Record<string, ServiceMapping> = {
  nova: {
    service: "Nova",
    post: {
      name: "Post",
      url: "https://nexirift.com/post/${id}",
    },
    direct_message: {
      name: "Direct Message",
      url: "https://nexirift.com/direct-message/${chatId}/?message=${messageId}",
    },
  },
  constellation: {
    service: "Constellation",
    card: "Card",
    board: "Board",
  },
};

// Function to replace template variables with actual values
function replaceTemplateVars(
  template: string,
  vars: Record<string, string>,
): string {
  // Safely replace each ${var} occurrence with its value.
  // We escape the literal characters `$` and `{` in the RegExp.
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\$\\{${key}\\}`, "g");
    result = result.replace(pattern, value);
  }
  return result;
}

// Rules display mappings
const RULES_MAP: Record<string, string> = {
  HATE_SPEECH: "Hate Speech",
  OFFENSIVE: "Offensive",
  SELF_HARM: "Self-Harm",
  VIOLENCE: "Violence",
  COPYRIGHT_INFRINGEMENT: "Copyright Infringement",
};

export default function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  // Disputes are currently typed as the base Dispute objects returned by the plugin.
  // If the client starts returning enriched objects (e.g. { ...dispute, violation: Violation | null })
  // you can introduce a composite type instead of widening everywhere:
  //
  //   type DisputeWithViolation = Dispute & { violation: Violation | null };
  //   const [disputes, setDisputes] = useState<DisputeWithViolation[]>([]);
  //
  // Leaving this as Dispute[] ensures we don't accidentally store null entries
  // (which triggered the earlier type error complaining about null not assignable to Dispute).
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViolations = useCallback(async () => {
    try {
      const { data } = await authClient.vortex.myViolations({
        query: {
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });
      setViolations(data?.violations || []);
    } catch (error) {
      handleError(
        error instanceof Error
          ? error
          : new Error("Failed to fetch violations"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDisputes = useCallback(async () => {
    try {
      const { data } = await authClient.vortex.myDisputes({
        query: {
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      });
      setDisputes(data?.disputes || []);
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error("Failed to fetch disputes"),
      );
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchViolations(), fetchDisputes()]);
  }, [fetchViolations, fetchDisputes]);

  // Filter violations
  const activeViolations = violations.filter(
    (v) =>
      !v.overturned && (!v.expiresAt || new Date(v.expiresAt) > new Date()),
  );

  const inactiveViolations = violations.filter(
    (v) => v.overturned || (v.expiresAt && new Date(v.expiresAt) < new Date()),
  );

  // Helper to enrich violation with dispute and expiry info
  const enrichViolation = (violation: Violation): ExtendedViolation => ({
    ...violation,
    expired:
      (violation.expiresAt && new Date(violation.expiresAt) < new Date()) ??
      false,
    dispute: disputes.find((d) => d.violationId === violation.id) || null,
  });

  // Render loading state
  const renderLoading = (type: string) => (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-md text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p>Loading {type} violations...</p>
    </div>
  );

  // Render empty state
  const renderEmpty = (type: string, message: string) => (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-md text-muted-foreground">
      <p className="mb-2">No {type} violations found.</p>
      <p className="text-sm">{message}</p>
    </div>
  );

  // Render violations list
  const renderViolationsList = (violationsList: Violation[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {violationsList.map((violation) => (
        <ViolationCard
          key={violation.id}
          violation={enrichViolation(violation)}
        />
      ))}
    </div>
  );

  return (
    <div className="flex gap-4 p-2 md:p-8">
      <main className="flex flex-col gap-4 w-full">
        <section className="flex flex-col gap-4">
          <header className="flex flex-col gap-2 md:gap-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-2xl font-bold">Violations</h1>
            </div>
            <p className="text-muted-foreground">
              View your active and expired violations.
            </p>
          </header>

          {/* Active violations section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Active</h2>
            </div>
            {loading
              ? renderLoading("active")
              : activeViolations.length === 0
                ? renderEmpty(
                    "active",
                    "Good job! Your account currently has no active violations.",
                  )
                : renderViolationsList(activeViolations)}
          </div>

          {/* Inactive violations section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Inactive</h2>
            </div>
            {loading
              ? renderLoading("inactive")
              : inactiveViolations.length === 0
                ? renderEmpty(
                    "inactive",
                    "Your account currently has no inactive violations.",
                  )
                : renderViolationsList(inactiveViolations)}
          </div>
        </section>
      </main>
    </div>
  );
}

function ViolationCard({ violation }: { violation: ExtendedViolation }) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);

  // Format dates
  const formattedCreatedAt = new Date(
    violation.createdAt || "",
  ).toLocaleString();
  const formattedExpiresAt = violation.expiresAt
    ? new Date(violation.expiresAt).toLocaleString()
    : "Never";

  const formattedDisputeDates = {
    createdAt: violation.dispute?.createdAt
      ? new Date(violation.dispute.createdAt).toLocaleString()
      : "",
    reviewedAt: violation.dispute?.reviewedAt
      ? new Date(violation.dispute.reviewedAt).toLocaleString()
      : "",
  };

  const handleOpenDetails = () => setIsDetailsOpen(true);
  const handleOpenDispute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDisputeOpen(true);
  };

  const formatDisputeStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const content: Content[] = JSON.parse(violation.content);

  return (
    <>
      <Card
        className="gap-2 hover:cursor-pointer transition-transform hover:scale-[1.02] duration-300"
        onClick={handleOpenDetails}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center">
              <span className="mr-2">
                {displayRules(
                  typeof violation.applicableRules === "string"
                    ? JSON.parse(violation.applicableRules)
                    : violation.applicableRules,
                )}
              </span>
              {violation.overturned ? (
                <Badge
                  variant="outline"
                  className="bg-green-500 dark:bg-green-700"
                >
                  Overturned
                </Badge>
              ) : violation.expired ? (
                <Badge variant="secondary">Expired</Badge>
              ) : null}
            </div>
          </CardTitle>
          <CardDescription>
            {!violation.dispute
              ? `You ${violation.expired ? "did not submit" : "have not submitted"} a dispute.`
              : `Dispute Status: ${formatDisputeStatus(violation.dispute.status)}`}
          </CardDescription>
        </CardHeader>

        <CardFooter className="text-muted-foreground text-sm flex flex-col items-start">
          <p>Created: {formattedCreatedAt}</p>
          <p
            className={cn(
              (violation.overturned || violation.expired) && "line-through",
            )}
          >
            Expires: {formattedExpiresAt}
          </p>
        </CardFooter>
      </Card>

      {/* Violation details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Violation Details</DialogTitle>
            <DialogDescription>
              Applicable rules:{" "}
              {displayRules(
                typeof violation.applicableRules === "string"
                  ? JSON.parse(violation.applicableRules)
                  : violation.applicableRules,
                true,
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 text-muted-foreground text-sm">
            {violation.publicComment && (
              <div>
                <h3 className="font-bold text-primary text-base mb-1">Note</h3>
                <p>{violation.publicComment}</p>
              </div>
            )}
            <div>
              <h3 className="font-bold text-primary text-base mb-1">Content</h3>
              {content.length > 0 && (
                <div className="gap-2 flex flex-wrap">
                  {content.map((c: Content, serviceIndex: number) =>
                    c.content.map((item, itemIndex: number) => {
                      const formattedService =
                        SERVICE_MAP[c.service]?.["service"];
                      const mappingRaw = SERVICE_MAP[c.service]?.[item.type];
                      // Derive friendly content type name (object provides name, string is used directly)
                      const contentType =
                        typeof mappingRaw === "object" && mappingRaw
                          ? (mappingRaw as ServiceItemMapping).name
                          : (mappingRaw as string) || item.type;

                      const uniqueKey =
                        item.id ||
                        item.chatId ||
                        item.cardId ||
                        `${serviceIndex}-${itemIndex}`;

                      const url =
                        typeof mappingRaw === "object" &&
                        mappingRaw &&
                        "url" in mappingRaw
                          ? replaceTemplateVars(
                              (mappingRaw as ServiceItemMapping).url || "",
                              item as any,
                            )
                          : "";

                      return (
                        <Card key={uniqueKey} className="w-full md:w-fit">
                          <CardHeader className="p-2">
                            <CardTitle className="text-sm text-blue-500 hover:underline">
                              <Link href={url} className="hover:underline">
                                {contentType} in {formattedService}
                              </Link>
                            </CardTitle>
                          </CardHeader>
                        </Card>
                      );
                    }),
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-primary text-base mb-1">Dispute</h3>

              {!violation.dispute ? (
                <p>
                  You{" "}
                  {violation.expired ? "did not submit" : "have not submitted"}{" "}
                  a dispute.
                </p>
              ) : (
                <>
                  <p>
                    <strong>Status:</strong>{" "}
                    {formatDisputeStatus(violation.dispute.status)}
                  </p>

                  {violation.dispute.reason && (
                    <div>
                      <p className="font-bold">Reason you provided:</p>
                      <p>{violation.dispute.reason}</p>
                    </div>
                  )}

                  {formattedDisputeDates.createdAt && (
                    <p>
                      <strong>Created at:</strong>{" "}
                      {formattedDisputeDates.createdAt}
                    </p>
                  )}

                  {formattedDisputeDates.reviewedAt && (
                    <p>
                      <strong>Reviewed at:</strong>{" "}
                      {formattedDisputeDates.reviewedAt}
                    </p>
                  )}
                </>
              )}

              <Button
                type="button"
                className="w-fit mt-2"
                variant="destructive"
                disabled={violation.dispute != null || violation.expired}
                size="sm"
                onClick={handleOpenDispute}
              >
                Dispute
              </Button>
            </div>
          </div>
          <DialogFooter className="flex sm:flex-col sm:justify-start flex-col items-start text-muted-foreground text-xs">
            <p>Created: {formattedCreatedAt}</p>
            <p
              className={cn(
                (violation.overturned || violation.expired) && "line-through",
              )}
            >
              Expires: {formattedExpiresAt}
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute form dialog */}
      <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Violation</DialogTitle>
            <DialogDescription>
              Explain why you believe this violation should be reconsidered.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {/* Dispute form would go here */}
          </div>
          <DialogFooter className="justify-start">
            <Button type="button" variant="destructive">
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function displayRules(rules: string[] | null, all: boolean = false) {
  if (!rules || rules.length === 0) {
    return "No rules specified";
  }

  // Map rule codes to human-readable names
  const parsedRules = rules.map((rule) => {
    const key = rule as keyof typeof RULES_MAP;
    return RULES_MAP[key] || rule;
  });

  // Return all rules formatted with proper grammar
  if (all) {
    if (parsedRules.length === 1) {
      return parsedRules[0];
    }

    return (
      parsedRules.slice(0, -1).join(", ") +
      (parsedRules.length > 1
        ? ` and ${parsedRules[parsedRules.length - 1]}`
        : "")
    );
  }

  // Return first rule with count indicator if there are more
  return (
    parsedRules[0] +
    (rules.length > 1 ? ` and ${rules.length - 1} more...` : "")
  );
}

/*
[
  {
    "service": "nova",
    "content": [
      {
        "type": "post",
        "id": "example-id-1"
      },
      {
        "type": "direct_message",
        "chatId": "example-id-2",
        "messageId": "example-id-3"
      }
    ]
  },
  {
    "service": "constellation",
    "content": [
      {
        "type": "card",
        "boardId": "example-id-4",
        "cardId": "example-id-5"
      }
    ]
  }
]
*/
