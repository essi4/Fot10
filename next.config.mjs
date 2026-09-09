/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/leagues/:slug",
        has: [{ type: "query", key: "tab", value: "matches" }],
        destination: "/leagues/:slug/matches",
      },
    ];
  },
};

export default nextConfig;
