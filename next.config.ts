import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nexirift/db", "@t3-oss/env-nextjs", "@t3-oss/env-core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media-minio.nexirift.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
