# Cloudflare Setup Guide for KNUE Board Hub

This guide walks you through setting up Cloudflare D1 database and Workers for the KNUE Board Hub project.

## 📋 Prerequisites

- Cloudflare account (free tier is sufficient)
- Node.js 18+ installed
- npm or yarn package manager

## 🚀 Step-by-Step Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
# or
yarn global add wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Create D1 Database

```bash
# Create the database
wrangler d1 create knue-board-hub

# Copy the database ID from the output and update wrangler.toml
# Replace "your-database-id-here" with the actual ID
```

### 4. Update Configuration

Edit `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "knue-board-hub"
database_id = "your-actual-database-id" # Replace with actual ID from step 3
```

### 5. Initialize Database Schema

```bash
# Install worker dependencies
npm install --package-lock-only

# Run database migrations (local for testing)
wrangler d1 execute knue-board-hub --file=./cloudflare/schema.sql
wrangler d1 execute knue-board-hub --file=./cloudflare/seed.sql

# For production deployment
wrangler d1 execute knue-board-hub --file=./cloudflare/schema.sql --remote
wrangler d1 execute knue-board-hub --file=./cloudflare/seed.sql --remote
```

### 6. Test Worker Locally

```bash
# Start local development server
wrangler dev

# Test API endpoints
curl http://localhost:8787/api/health
curl http://localhost:8787/api/departments
curl http://localhost:8787/api/rss/items
```

### 7. Deploy to Production

```bash
# Deploy worker
wrangler deploy

# Your API will be available at:
# https://knue-board-hub-api.your-subdomain.workers.dev
```

### 8. Update Frontend Configuration

Create `.env` file in your Vue project:

```env
VITE_API_URL=https://knue-board-hub-api.your-subdomain.workers.dev/api
```

## 🔧 Advanced Configuration

### Custom Domain (Optional)

1. Add custom domain in Cloudflare dashboard
2. Update `wrangler.toml` routes section:

```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### Environment Variables

For different environments:

```toml
[env.staging]
vars = { ENVIRONMENT = "staging", CORS_ORIGIN = "https://staging.yourdomain.com" }

[env.production]
vars = { ENVIRONMENT = "production", CORS_ORIGIN = "https://yourdomain.com" }
```

Deploy to specific environment:

```bash
wrangler deploy --env staging
wrangler deploy --env production
```

## 📊 Database Management

### Query Database

```bash
# Interactive shell
wrangler d1 execute knue-board-hub --command "SELECT * FROM departments"

# Check table structure
wrangler d1 execute knue-board-hub --command ".schema"

# View data
wrangler d1 execute knue-board-hub --command "SELECT COUNT(*) FROM rss_cache"
```

### Backup Database

```bash
# Export all data
wrangler d1 export knue-board-hub --output backup.sql
```

## 🔐 Future: Google OAuth Setup

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)

### 2. Environment Variables

Add to `wrangler.toml` (only non-sensitive values):

```toml
[vars]
GOOGLE_CLIENT_ID = "your-google-client-id"
```

**⚠️ Security Note:** Use `wrangler secret put` for sensitive values (see Setting Secrets section below):

```bash
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET
```

### 3. Frontend Integration

For Vue 3 frontend, use Google Identity Services:

```bash
# Install Google Identity Services for web
npm install google-auth-library
# or use the script tag approach (recommended for web)
```

Add to your `index.html`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

Example Vue composable:

```js
// composables/useGoogleAuth.js
const useGoogleAuth = () => {
  const signIn = () => {
    window.google.accounts.id.prompt()
  }
  
  return { signIn }
}
```

## 📈 Monitoring & Analytics

### Cloudflare Analytics

- Monitor request volume in Cloudflare dashboard
- Set up alerts for error rates
- Track performance metrics

### Database Monitoring

```bash
# Monitor database usage
wrangler d1 info knue-board-hub

# View recent logs
wrangler tail
```

## 🛡️ Security Best Practices

1. **CORS Configuration**: Restrict origins in production
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Input Validation**: Validate all user inputs
4. **Environment Secrets**: Use Wrangler secrets for sensitive data
5. **Database Access**: Limit database permissions

### Setting Secrets

```bash
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put JWT_SECRET
```

## 🚦 Free Tier Limits

**Cloudflare Workers Free Tier:**

- 100,000 requests per day
- 10ms CPU time per request
- 128MB memory

**D1 Database Free Tier:**

- 5GB storage
- 25 million read requests per month
- 50,000 writes per day

**Pages (for frontend):**

- Unlimited static requests
- 500 builds per month
- 100GB bandwidth

## 🔗 Useful Commands

```bash
# View logs in real-time
wrangler tail

# List deployments
wrangler deployments list

# Rollback deployment
wrangler rollback

# View secrets
wrangler secret list

# Delete secret
wrangler secret delete SECRET_NAME
```

## 🆘 Troubleshooting

### Common Issues

1. **Database connection errors**: Check database ID in wrangler.toml
2. **CORS errors**: Update CORS_ORIGIN environment variable
3. **Rate limiting**: Implement caching and request throttling
4. **Memory errors**: Optimize API responses and database queries

### Debug Mode

```bash
# Enable debug logging
wrangler dev --log-level debug

# View detailed error information
wrangler tail --format json
```

## 📚 Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [Hono Framework Documentation](https://hono.dev/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

---

**Next Steps:**

1. Complete the setup above
2. Test all API endpoints
3. Update your Vue frontend to use the new API
4. Plan Google OAuth integration for user features
5. Monitor usage and optimize performance
