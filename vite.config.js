import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), UnoCSS()],
  server: {
    proxy: {
      // Proxy Worker API endpoints to Cloudflare Worker
      '^/api/(departments|rss/(items|refresh)|health|auth|user)': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => {
            console.log('❌ Proxy error - make sure Cloudflare Worker is running with: npx wrangler dev')
            console.log('   Run in another terminal: npx wrangler dev')
          })
          proxy.on('proxyReq', (proxyReq) => {
            console.log('🔄 Proxying to Worker:', proxyReq.method, proxyReq.path)
          })
        }
      },
      // CORS proxy for direct RSS XML fetching (legacy, for development only)
      '/api/rss': {
        target: 'https://www.knue.ac.kr',
        changeOrigin: true,
        rewrite: (path) => {
          // Only handle direct RSS XML requests with ?url= parameter
          const url = new URL(`http://localhost${path}`)
          const targetUrl = url.searchParams.get('url')
          if (targetUrl) {
            const decodedUrl = decodeURIComponent(targetUrl)
            return new URL(decodedUrl).pathname + new URL(decodedUrl).search
          }
          return '/rssBbsNtt.do'
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Add necessary headers for RSS requests
            proxyReq.setHeader('Accept', 'application/rss+xml, application/xml, text/xml')
            proxyReq.setHeader('User-Agent', 'KNUE-RSS-Aggregator/1.0')
          })
          proxy.on('proxyRes', (proxyRes) => {
            // Add CORS headers
            proxyRes.headers['Access-Control-Allow-Origin'] = '*'
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
          })
        }
      }
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          rss: ['./src/utils/rssParser.js', './src/composables/useRssFeed.js']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})