/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/listing/sing-and-sign-ealing',
        destination: '/listing/sing-and-sign-ealing-333',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
