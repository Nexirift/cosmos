import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nexirift/db", "@t3-oss/env-nextjs", "@t3-oss/env-core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.nexirift.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "priv.au",
        port: "",
        pathname: "/image_proxy/**",
      },
    ],
  },
};

export default nextConfig;
