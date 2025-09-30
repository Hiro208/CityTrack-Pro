import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 这里的别名是解决 "Missing '.' specifier" 报错的关键
      'react-map-gl': 'react-map-gl/dist/esm/index.js',
    },
  },
});