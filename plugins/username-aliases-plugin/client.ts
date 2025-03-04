import { BetterAuthClientPlugin } from "better-auth";
import type { usernameAliases } from "./index";

type UsernameAliasesPlugin = typeof usernameAliases;

export const usernameAliasesClient = () => {
  return {
    id: "username-aliases",
    $InferServerPlugin: {} as ReturnType<UsernameAliasesPlugin>,
  } satisfies BetterAuthClientPlugin;
};
