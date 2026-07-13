/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The @supabase/ssr package uses some Node APIs that Next.js reports as
  // unsupported in the Edge Runtime. The package is only used in Server
  // Components and Route Handlers (never in the middleware itself), so the
  // warning is a false-positive. Marking it as an external package keeps
  // the Edge-runtime middleware bundle clean while the server-side code
  // compiles normally.
  serverExternalPackages: ['@supabase/ssr'],
};
export default nextConfig;
