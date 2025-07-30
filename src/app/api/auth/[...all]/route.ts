import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204 });
}
