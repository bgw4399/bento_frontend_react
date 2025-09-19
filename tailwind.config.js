/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // src 폴더 안의 모든 JSX/TSX 파일을 스캔하도록 설정
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
