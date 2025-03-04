import { BetterAuthClientPlugin } from "better-auth";
import type { birthday } from "./index"; // make sure to import the server plugin as a type

type BirthdayPlugin = typeof birthday;

export const birthdayClient = () => {
  return {
    id: "birthday",
    $InferServerPlugin: {} as ReturnType<BirthdayPlugin>,
  } satisfies BetterAuthClientPlugin;
};
