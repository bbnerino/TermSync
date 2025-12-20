/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  typescript: {
    // 빌드 시 타입 체크 건너뛰기
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 ESLint 체크 건너뛰기
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig

