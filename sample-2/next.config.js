/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // MetaMask SDK의 React Native 모듈을 무시하여 경고 제거
    if (!isServer) {
      // IgnorePlugin을 사용하여 모듈을 완전히 무시
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@react-native-async-storage\/async-storage$/,
        })
      );

      // fallback도 설정
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@react-native-async-storage/async-storage": false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
