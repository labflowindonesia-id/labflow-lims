# LabFlow LIMS Backend Deployment Guide

## Prerequisites

1. **Fly.io CLI**: Install flyctl
   ```powershell
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Fly.io Account**: Sign up at https://fly.io

3. **Authentication**:
   ```bash
   flyctl auth login
   ```

## Deployment Steps

### 1. Initialize Fly App (First Time Only)

```bash
cd backend
flyctl launch --no-deploy
```

When prompted:
- App name: `labflow-api` (or your preferred name)
- Region: `sin` (Singapore) - closest to Indonesia
- Skip PostgreSQL/Redis setup (we use Supabase)

### 2. Set Environment Secrets

```bash
# Required secrets
flyctl secrets set SUPABASE_URL=your_supabase_url
flyctl secrets set SUPABASE_ANON_KEY=your_anon_key
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_key
flyctl secrets set DATABASE_URL=your_database_connection_string
flyctl secrets set JWT_SECRET=your_jwt_secret

# Optional
flyctl secrets set WEBHOOK_SECRET=your_webhook_secret
flyctl secrets set N8N_WEBHOOK_URL=your_n8n_url
```

### 3. Deploy

```bash
flyctl deploy
```

### 4. Verify Deployment

```bash
# Check status
flyctl status

# View logs
flyctl logs

# Open the API docs
flyctl open /docs
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for JWT signing |
| `WEBHOOK_SECRET` | ❌ | Secret for webhook signatures |
| `N8N_WEBHOOK_URL` | ❌ | n8n webhook URL |

## Useful Commands

```bash
# Scale the app
flyctl scale count 2

# SSH into the container
flyctl ssh console

# Open logs in browser
flyctl dashboard

# Restart the app
flyctl apps restart labflow-api
```

## Production Checklist

- [ ] All required secrets are set
- [ ] Database migrations are applied
- [ ] Health check passes (`/health`)
- [ ] API docs accessible (`/docs`)
- [ ] CORS configured for frontend domain
- [ ] SSL/TLS enabled (automatic on Fly.io)
