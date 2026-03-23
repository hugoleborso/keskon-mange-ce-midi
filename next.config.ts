import { paraglideWebpackPlugin } from "@inlang/paraglide-js";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "lh3.googleusercontent.com" },
			{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
		],
	},
	webpack: (config) => {
		config.plugins.push(
			paraglideWebpackPlugin({
				outdir: "./src/paraglide",
				project: "./project.inlang",
			}),
		);
		return config;
	},
};

export default nextConfig;
