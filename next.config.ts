import type { NextConfig } from "next";

// Remote images (admin uploads served by the API, or an S3/R2/CDN bucket) must be allow-listed for next/image.
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api");
const extraHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean); // e.g. cdn.example.com,my-bucket.s3.amazonaws.com

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: apiUrl.protocol.replace(":", "") as "http" | "https", hostname: apiUrl.hostname, ...(apiUrl.port ? { port: apiUrl.port } : {}), pathname: "/storage/**" },
      ...extraHosts.map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
