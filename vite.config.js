import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), UnoCSS()],
  server: {
    proxy: {
      // Proxy API calls to Cloudflare Worker (run with: npx wrangler dev)
      // Must be before /api/rss to match more specific routes first
      '^/api/(?!rss).*': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ Proxy error - make sure Cloudflare Worker is running with: npx wrangler dev')
            console.log('   Run in another terminal: npx wrangler dev')
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxying to Worker:', proxyReq.method, proxyReq.path)
          })
        }
      },
      // CORS proxy for RSS feeds during development
      '/api/rss': {
        target: 'https://www.knue.ac.kr',
        changeOrigin: true,
        rewrite: (path) => {
          // Extract URL from query parameter
          const url = new URL(`http://localhost${path}`)
          const targetUrl = url.searchParams.get('url')
          if (targetUrl) {
            const decodedUrl = decodeURIComponent(targetUrl)
            return new URL(decodedUrl).pathname + new URL(decodedUrl).search
          }
          return '/rssBbsNtt.do'
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add necessary headers for RSS requests
            proxyReq.setHeader('Accept', 'application/rss+xml, application/xml, text/xml')
            proxyReq.setHeader('User-Agent', 'KNUE-RSS-Aggregator/1.0')
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
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