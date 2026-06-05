import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  reactStrictMode: true,
  transpilePackages: ["@batho/config", "@batho/core", "@batho/design-tokens"]
};

export default nextConfig;
