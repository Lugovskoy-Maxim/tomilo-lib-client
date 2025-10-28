import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['picsum.photos', "baconmockup.com", "http://localhost:3001/*", "http://localhost:3000/*"],
  },
};
export default nextConfig;
