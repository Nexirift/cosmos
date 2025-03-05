import type { invitation } from "./index";
import type { BetterAuthClientPlugin } from "better-auth";

export const invitationClient = () => {
  return {
    id: "invitation",
    $InferServerPlugin: {} as ReturnType<typeof invitation>,
    pathMethods: {
      "/invitation/create": "POST",
    },
  } satisfies BetterAuthClientPlugin;
};
