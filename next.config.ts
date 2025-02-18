import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nexirift/db", "@t3-oss/env-nextjs", "@t3-oss/env-core"],
};

export default nextConfig;
