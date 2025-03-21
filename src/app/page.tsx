"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { handleError } from "@/lib/common";
import Image from "next/image";
import { useRouter } from "next/navigation";
// import { compress, decompress } from "compress-json";

export default function Page() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  /* authClient.vortex.createViolation({
    userId: "tZYDFXoO8swIkjk7590iqyZ8s3tp9hoU",
    applicableRules: ["rule-1", "rule-2"],
    content: JSON.stringify([
      {
        service: "nova",
        content: [
          { type: "post", id: "example-id-1" },
          {
            type: "direct_message",
            chatId: "example-id-2",
            messageId: "example-id-3",
          },
        ],
      },
      {
        service: "constellation",
        content: [
          { type: "card", boardId: "example-id-4", cardId: "example-id-5" },
        ],
      },
    ]),
    severity: 1,
  }); */

  /* authClient.vortex.listViolations({
    query: {
      userId: "RpdOdxa08kyO1mHXr2QCphdTibk2uSp0",
    },
  }); */

  /* authClient.vortex.updateViolation({
    id: "cXZ9GxDSiqRSWz2xIsdXg3h52S3Yfq0K",
    severity: 5,
  }); */

  /* authClient.vortex.myViolations(); */

  /* const json = JSON.parse(
    '[{"service":"nova","content":[{"type":"post","id":"example-id-1"},{"type":"direct_message","chatId":"example-id-2","messageId":"example-id-3"}]},{"service":"constellation","content":[{"type":"card","boardId":"example-id-4","cardId":"example-id-5"}]},{"service":"nova","content":[{"type":"post","id":"example-id-1"},{"type":"direct_message","chatId":"example-id-2","messageId":"example-id-3"}]},{"service":"constellation","content":[{"type":"card","boardId":"example-id-4","cardId":"example-id-5"}]},{"service":"nova","content":[{"type":"post","id":"example-id-1"},{"type":"direct_message","chatId":"example-id-2","messageId":"example-id-3"}]},{"service":"constellation","content":[{"type":"card","boardId":"example-id-4","cardId":"example-id-5"}]},{"service":"nova","content":[{"type":"post","id":"example-id-1"},{"type":"direct_message","chatId":"example-id-2","messageId":"example-id-3"}]},{"service":"constellation","content":[{"type":"card","boardId":"example-id-4","cardId":"example-id-5"}]},{"service":"nova","content":[{"type":"post","id":"example-id-1"},{"type":"direct_message","chatId":"example-id-2","messageId":"example-id-3"}]},{"service":"constellation","content":[{"type":"card","boardId":"example-id-4","cardId":"example-id-5"}]},{"service":"nova","content":[{"type":"post","id":"example-id-1"},{"type":"direct_message","chatId":"example-id-2","messageId":"example-id-3"}]},{"service":"constellation","content":[{"type":"card","boardId":"example-id-4","cardId":"example-id-5"}]},{"service":"nova","content":[{"type":"post","id":"example-id-1"},{"type":"direct_message","chatId":"example-id-2","messageId":"example-id-3"}]},{"service":"constellation","content":[{"type":"card","boardId":"example-id-4","cardId":"example-id-5"}]}]',
  );

  console.log(
    "original",
    json,
    "size",
    Buffer.byteLength(JSON.stringify(json)),
  );

  const jsonCompressed = compress(json);

  console.log(
    "compressed",
    jsonCompressed,
    "size",
    Buffer.byteLength(JSON.stringify(jsonCompressed)),
  );

  const jsonDecompressed = decompress(jsonCompressed);

  console.log(
    "decompressed",
    jsonDecompressed,
    "size",
    Buffer.byteLength(JSON.stringify(jsonDecompressed)),
  ); */

  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center gap-4">
      <Image
        src="/assets/images/banner.png"
        alt="Cosmos"
        width={300}
        height={95.15}
        className="transition-transform hover:scale-110 duration-700"
      />
      {session?.user ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground">
            Logged in as {session.user.email}
          </span>
        </div>
      ) : isPending ? (
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-muted-foreground">Not logged in</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const userData = {
                email: "developer@nexirift.com",
                password: "P@ssw0rd",
                username: "Developer",
                name: "Developer User",
                birthday: "2007-11-21",
                invite: "nexirift-m0dm0-vp7sv",
              };

              const { data, error } = await authClient.signUp.email(userData);

              if (error && !data) {
                throw new Error(error.message);
              }

              toast("New user created!");
            } catch (error) {
              if (error instanceof Error) {
                handleError(error);
              } else {
                handleError(new Error("An unexpected error occurred"));
              }
            }
          }}
        >
          Create Test User
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            router.push("/sign-in");
            /* const { data: subscriptions } =
              await authClient.subscription.cancel({
                returnUrl: "/dashboard",
              });
            console.log(subscriptions); */
            /* const { error: error1 } = await authClient.subscription.upgrade({
              plan: "nebula-individual",
              successUrl: "/dashboard",
              cancelUrl: "/",
            });

            if (error1) {
              alert(error1.message);
              } */
          }}
        >
          Trigger Login Flow
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              const { data, error } = await authClient.signOut();

              if (error) {
                throw new Error(error.message);
              }

              if (data?.success) {
                toast("New user created!");
              } else {
                throw new Error("An error occurred while logging out");
              }
            } catch (error) {
              if (error instanceof Error) {
                handleError(error);
              } else {
                handleError(new Error("An unexpected error occurred"));
              }
            }
          }}
        >
          Force Logout Event
        </Button>
      </div>
    </div>
  );
}
