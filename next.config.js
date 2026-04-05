/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/listing/sing-and-sign-ealing-333',
        destination: '/listing/sing-and-sign-ealing',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
