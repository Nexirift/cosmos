import { env } from "@/env";
import { checkCache, getAllSettings } from "@/lib/actions";
import { getEnabledPlugins } from "@/lib/auth";

export async function GET() {
  if (!(await checkCache("nexirift_mode"))) {
    return new Response("Not Found", { status: 404 });
  }

  return Response.json({
    version: process.env.npm_package_version,
    environment: env.NODE_ENV,
    plugins: getEnabledPlugins(),
    settings: await getAllSettings(),
  });
}
