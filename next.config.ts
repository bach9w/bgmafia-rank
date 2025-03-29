import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	async rewrites() {
		return [
			{
				source: "/api/rankings/extract",
				destination: "/api/rankings/extract",
			},
		];
	},
};

export default nextConfig;
