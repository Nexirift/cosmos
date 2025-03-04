import { BetterAuthClientPlugin } from "better-auth";
import type { vortex } from "./index";

type VortexPlugin = typeof vortex;

export const vortexClient = () => {
  return {
    id: "vortexPlugin",
    $InferServerPlugin: {} as ReturnType<VortexPlugin>,
  } satisfies BetterAuthClientPlugin;
};
