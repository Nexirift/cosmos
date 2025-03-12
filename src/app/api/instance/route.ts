import { env } from "@/env";
import { getEnabledPlugins } from "@/lib/auth";

export async function GET() {
  if (!env.IS_NEXIRIFT_MODE) {
    return new Response("Not Found", { status: 404 });
  }

  return Response.json({
    name: env.APP_NAME,
    version: process.env.npm_package_version,
    environment: env.NODE_ENV,
    plugins: getEnabledPlugins(),
  });
}
