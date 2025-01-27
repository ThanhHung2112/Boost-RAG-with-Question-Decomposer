/** @type {import('next').NextConfig} */
const nextConfig = {
    pageExtensions: ["mdx", "ts", "tsx"],
    swcMinify: true,
    transpilePackages: ["@shared/tailwind-config"],
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
        config.module.rules.push({
            test: /\.worker\.(ts|js)$/,
            loader: 'worker-loader',
            options: {
                filename: 'static/workers/[name].[contenthash].js',
            }
        });

        if (!isServer) {
            config.output.globalObject = 'self';
        }

        return config;
    },
    experimental: {
        turbo: {
            resolveExtensions: [
                '.mdx', 
                '.tsx', 
                '.ts', 
                '.jsx', 
                '.js', 
                '.mjs', 
                '.json',
                '.worker.ts'
            ],
            useSwcCss: true,
            rules: {
                '*.svg': {
                    loaders: ['@svgr/webpack'],
                    as: '*.js',
                }
            },
            treeshaking: true,
            moduleIds: 'deterministic',
        }
    },
    images: {
        domains: ['your-image-cdn.com'],
        formats: ['image/avif', 'image/webp'],
    },
};

module.exports = nextConfig;