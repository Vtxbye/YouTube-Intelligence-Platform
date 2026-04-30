import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.137"],
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/:path*"
            : `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
  reactStrictMode: false,
};

export default nextConfig;

