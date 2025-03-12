import type { vortex } from "./index";
import type { BetterAuthClientPlugin } from "better-auth";

export const vortexClient = () => {
  return {
    id: "vortex",
    $InferServerPlugin: {} as ReturnType<typeof vortex>,
    pathMethods: {
      "/vortex/test": "POST",
      "/vortex/create-violation": "POST",
      "/vortex/list-violations": "GET",
      "/vortex/update-violation": "POST",
    },
  } satisfies BetterAuthClientPlugin;
};
