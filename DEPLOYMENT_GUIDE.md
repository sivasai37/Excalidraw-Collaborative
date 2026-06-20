# Excalidraw Collaborative Drawing App - Deployment Guide

## Overview

This is a production-ready collaborative drawing application built with:
- **Frontend**: Next.js 15.2.4 with React 19 and Tailwind CSS
- **REST API**: Express.js on port 3002
- **WebSocket Server**: ws 8.18.0 on port 8080
- **Database**: PostgreSQL with Prisma ORM
- **Monorepo**: pnpm workspaces with Turbo

## Pre-Deployment Checklist

### ✅ Code Quality Verification

- [ ] **TypeScript Compilation**: All code type-safe with zero `any` types
- [ ] **Security**: No hardcoded tokens, all values in environment variables
- [ ] **Environment Variables**: All required variables defined in `.env`
- [ ] **Code Cleanup**: No unused imports, no dead code, no console.logs
- [ ] **WebSocket Cleanup**: Proper listeners removed on disconnect
- [ ] **Error Handling**: Try-catch blocks around all database operations

### ✅ Database Setup

- [ ] PostgreSQL database created
- [ ] `DATABASE_URL` set to correct connection string
- [ ] All Prisma migrations applied successfully
- [ ] `PencilStroke` and `TextItem` tables created
- [ ] Foreign key constraints verified

### ✅ Secrets and Configuration

- [ ] JWT_SECRET generated (minimum 32 characters) and set in production
- [ ] NEXT_PUBLIC_BACKEND_URL set to production backend URL
- [ ] NEXT_PUBLIC_WS_URL set to production WebSocket URL
- [ ] All values removed from `.env` and sourced from environment

### ✅ Testing Completed

- [ ] User signup with email validation
- [ ] User signin returns valid JWT token
- [ ] Room creation and joining
- [ ] Real-time pencil stroke drawing
- [ ] Real-time text item placement
- [ ] Persistence: strokes/text reload on room rejoin
- [ ] WebSocket disconnect cleanup
- [ ] Error handling for invalid rooms/tokens

## Environment Variables

Required environment variables (create in deployment platform):

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/excalidraw_db

# JWT Authentication (must be strong in production)
JWT_SECRET=your_secure_random_secret_min_32_chars

# Frontend URLs (public - visible to browser)
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com

# Node Environment
NODE_ENV=production
```

### Generate Secure JWT_SECRET

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Online generator (use https://www.uuidgenerator.net/)
```

## Build Instructions

### Local Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Apply Prisma migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# Start development servers (in separate terminals)
# Terminal 1: Frontend
cd apps/excelidraw-frontend && pnpm dev

# Terminal 2: HTTP Backend
cd apps/http-backend && pnpm dev

# Terminal 3: WebSocket Backend
cd apps/ws-backend && pnpm dev
```

### Production Build

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Type-check all packages
pnpm run build

# Verify ESLint compliance
pnpm run lint

# Apply Prisma migrations to production database
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

## Deployment Steps

### 1. Frontend (Next.js)

Deploy to Vercel, Netlify, or Docker:

```bash
# Build
pnpm run build --filter excelidraw-frontend

# Start (if self-hosted)
cd apps/excelidraw-frontend
pnpm start
```

**Vercel Deployment**:
```bash
# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
# NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com

# Push to Git and connect to Vercel
```

### 2. HTTP Backend (Express)

Deploy to Railway, Heroku, Docker, or Linux server:

```bash
# Build
pnpm run build --filter http-backend

# Start
cd apps/http-backend
pnpm start
# Runs on port 3002
```

**Set environment variables**:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`

### 3. WebSocket Backend (ws)

Deploy alongside HTTP Backend or on separate server:

```bash
# Build
pnpm run build --filter ws-backend

# Start
cd apps/ws-backend
pnpm start
# Runs on port 8080
```

**Set environment variables**:
- `DATABASE_URL`
- `JWT_SECRET`
- `NODE_ENV=production`
- `WS_PORT=8080` (if needed)

### 4. Database

**PostgreSQL Setup**:

```bash
# Create database
createdb excalidraw_db

# Apply migrations
pnpm prisma migrate deploy

# Verify schema
pnpm prisma studio
```

### Docker Deployment

**Dockerfile for Express/WebSocket**:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY pnpm-lock.yaml ./
COPY package.json ./
COPY pnpm-workspace.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

COPY . .

# Build backend
RUN pnpm run build --filter http-backend

EXPOSE 3002

CMD ["node", "apps/http-backend/dist/index.js"]
```

**Docker Compose**:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: excalidraw_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: securepassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "3002:3002"
    environment:
      DATABASE_URL: postgresql://postgres:securepassword@postgres:5432/excalidraw_db
      JWT_SECRET: your_secure_jwt_secret
      NODE_ENV: production
    depends_on:
      - postgres

  ws:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://postgres:securepassword@postgres:5432/excalidraw_db
      JWT_SECRET: your_secure_jwt_secret
      NODE_ENV: production
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## Deployment Platform Guides

### Vercel (Frontend)

1. Connect GitHub repository
2. Set framework preset: Next.js
3. Set environment variables in Dashboard
4. Auto-deploys on push to main

### Railway (Backend)

1. Connect GitHub repository
2. Create database service (PostgreSQL)
3. Create two application services (HTTP Backend + WebSocket)
4. Set environment variables
5. Auto-deploys on push

### DigitalOcean App Platform

1. Create PostgreSQL database
2. Create two app services from GitHub
3. Set environment variables and database URL
4. Deploy

## Monitoring & Troubleshooting

### Health Check Endpoints

```bash
# HTTP Backend
curl https://api.yourdomain.com/health

# WebSocket
wscat -c wss://ws.yourdomain.com
# Should connect and wait for JWT token
```

### Log Monitoring

**Frontend Logs** (Vercel):
- Dashboard > Deployments > Function Logs

**Backend Logs** (Railway/DigitalOcean):
- Application > Deployments > Logs

**Database Logs** (PostgreSQL):
- Monitor for connection errors, query timeouts

### Common Issues

**Issue**: WebSocket connection refused
- Check firewall allows port 8080 or 443 (WSS)
- Verify `NEXT_PUBLIC_WS_URL` is correct
- Check WebSocket server logs

**Issue**: JWT token invalid
- Verify `JWT_SECRET` is same across all services
- Check token expiration in frontend
- Verify localStorage has token after signin

**Issue**: Strokes/text not persisting
- Check `DATABASE_URL` is correct
- Verify Prisma migrations applied: `pnpm prisma migrate status`
- Check PencilStroke and TextItem tables exist
- Check database user has write permissions

**Issue**: CORS errors
- Frontend cannot reach backend API
- Check `NEXT_PUBLIC_BACKEND_URL` is correct
- Verify backend CORS middleware allows frontend origin

## Performance Optimization

### Frontend

```javascript
// Enable in next.config.ts
compression: true,
swcMinify: true,

// Image optimization
images: {
  unoptimized: false,
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'",
}
```

### Backend

- Use connection pooling: `DATABASE_URL` pool settings
- Cache room validation results
- Implement rate limiting on signup/signin
- Monitor database query performance

### WebSocket

- Limit concurrent connections per room
- Implement message batching for high-frequency updates
- Close idle connections after 30 minutes
- Monitor memory usage with many simultaneous rooms

## Security Checklist

### ✅ Authentication

- [ ] JWT tokens stored in localStorage (secure for this app)
- [ ] Token validation on every WebSocket connection
- [ ] Password minimum 6 characters enforced
- [ ] Email validation on signup

### ✅ Authorization

- [ ] Users can only access rooms they joined
- [ ] Users can only modify their own strokes/text
- [ ] Room IDs are not sequential (prevent enumeration)

### ✅ Data Protection

- [ ] All communications over HTTPS/WSS in production
- [ ] Database credentials not in code
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] No sensitive data logged

### ✅ Infrastructure

- [ ] Database firewall restricted to application servers
- [ ] PostgreSQL user has minimal required permissions
- [ ] Backups automated and tested
- [ ] SSL/TLS certificates valid and renewed

## Database Backups

### PostgreSQL Backup Commands

```bash
# Full backup
pg_dump -Fc excalidraw_db > backup.dump

# Restore
pg_restore -d excalidraw_db backup.dump

# Automated daily backup (cron)
0 2 * * * pg_dump -Fc excalidraw_db > /backups/excalidraw_$(date +\%Y\%m\%d).dump
```

### Backup Storage

- Store backups in S3, GCS, or managed backup service
- Retain backups for at least 30 days
- Test restore procedure monthly

## Rollback Plan

### If Critical Issue Occurs

1. **Frontend**: Revert to previous Vercel deployment
2. **Backend**: Roll back Git commit and redeploy
3. **Database**: Restore from backup
4. **Communication**: Notify users of incident

### Zero-Downtime Deployment

1. Deploy new backend code (doesn't change schema)
2. Run Prisma migrations
3. Deploy frontend (uses new backend)
4. Monitor error rates

## Monitoring & Alerting

### Key Metrics

- API response time (target: <200ms)
- WebSocket connection errors
- Database query time (target: <100ms)
- Memory usage (alert if >80%)
- Error rate (alert if >1%)

### Recommended Tools

- **Frontend**: Vercel Analytics, Sentry
- **Backend**: Datadog, New Relic, or self-hosted Prometheus
- **Database**: PostgreSQL monitoring tools
- **Logging**: ELK Stack or managed service

## Maintenance

### Weekly

- [ ] Monitor error logs for patterns
- [ ] Check database query performance
- [ ] Verify backups completed

### Monthly

- [ ] Test backup restore procedure
- [ ] Review and update dependencies
- [ ] Analyze user metrics and performance
- [ ] Security scan for vulnerabilities

### Quarterly

- [ ] Full penetration testing consideration
- [ ] Performance optimization review
- [ ] Database statistics and index analysis
- [ ] Load testing with anticipated user growth

## Support & Resources

- **Documentation**: See README.md in each package
- **Issues**: Check GitHub Issues for known problems
- **Questions**: Review inline code comments
- **Architecture**: See project structure diagram

## Deployment Success Criteria

- [ ] Frontend loads without errors
- [ ] User can sign up and sign in
- [ ] Pencil drawing works in real-time
- [ ] Text placement works in real-time
- [ ] Strokes persist and load on rejoin
- [ ] Multiple users can draw simultaneously
- [ ] WebSocket cleanup prevents memory leaks
- [ ] All environment variables working
- [ ] Database backup strategy implemented
- [ ] Monitoring and alerting configured

---

**Last Updated**: December 2024
**Version**: 1.0
**Status**: Production Ready
