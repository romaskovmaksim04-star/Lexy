import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The voice tutor used to live under its old name
  async redirects() {
    return [{ source: "/app/preppy/:path*", destination: "/app/lexi/:path*", permanent: true }];
  },
};

export default nextConfig;
