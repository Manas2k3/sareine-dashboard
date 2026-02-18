/** @type {import('next').NextConfig} */
const nextConfig = {
    /* Redirect root to /admin */
    async redirects() {
        return [
            {
                source: "/",
                destination: "/admin",
                permanent: false,
            },
        ];
    },
};

export default nextConfig;
