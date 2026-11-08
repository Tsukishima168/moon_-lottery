import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('@supabase')) return 'supabase'
            // @line/liff 不放進手動分組：分組會讓入口 chunk 靜態 import 它，SDK 就回到首屏。
            // 交給動態 import() 自然切出獨立 chunk（見 guard-liff-lazy-loading）。
            if (id.includes('framer-motion')) return 'motion'
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor'
            }
            return undefined
          },
        },
      },
    },
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'guard-liff-lazy-loading',
        apply: 'build',
        generateBundle(_options, bundle) {
          // 每次 build 都檢查：從入口 chunk 靜態可達的 chunk 裡不能出現 LINE SDK。
          // manualChunks 的共用分組可能讓 SDK 悄悄回到首屏。
          const visited = new Set<string>();
          const visit = (fileName: string) => {
            if (visited.has(fileName)) return;
            visited.add(fileName);
            const chunk = bundle[fileName];
            if (!chunk || chunk.type !== 'chunk') return;
            if (chunk.code.includes('LIFF_STORE:')) {
              this.error(`LINE SDK must remain lazy: ${fileName}`);
            }
            chunk.imports.forEach(visit);
          };
          Object.values(bundle).forEach((chunk) => {
            if (chunk.type === 'chunk' && chunk.isEntry) visit(chunk.fileName);
          });
        },
      },
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        // 圖示由 workbox.globPatterns（png）預快取一次；關掉外掛另外把 manifest 圖示、includeAssets 再加一次的行為，
        // 否則 precache 清單裡每張圖示會出現兩次（revision 相同，只是白白變大）。
        includeManifestIcons: false,
        manifest: {
          name: '月島・遊戲中心',
          short_name: '月島遊戲中心',
          description: '每天免費收下一份 Kiwimu 祝福，也可以用本機遊戲積分參與幸運轉盤。券與印章為預覽，實體兌換尚未開放。',
          theme_color: '#1F2F1F',
          background_color: '#F5F0E8',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          lang: 'zh-TW',
          icons: [
            {
              src: '/icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icons/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          clientsClaim: true,
          importScripts: ['/pwa-retire-member-cache.js'],
          navigateFallback: '/',
          globPatterns: ['**/*.{css,js,html,svg,png,jpg,ico,txt,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              // 會員與驗證回應不使用跨帳號的離線快取。
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 30 },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
