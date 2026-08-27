import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/command-centre", destination: "/command-center", permanent: false },
      { source: "/band-registry", destination: "/bands", permanent: false },
    ];
  },
};

export default nextConfig;
