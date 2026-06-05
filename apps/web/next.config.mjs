import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  reactStrictMode: true,
  transpilePackages: ["@batho/config", "@batho/design-tokens", "@batho/ui"]
};

export default nextConfig;
