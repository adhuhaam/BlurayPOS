# Deployment Guide

## Overview

This guide covers deploying Enterprise POS to a cloud environment. The recommended stack:

- **Backend**: Azure App Service, AWS ECS, or any container host
- **Database**: Managed PostgreSQL (Azure Database, AWS RDS, Supabase, Neon)
- **Frontend**: Static hosting (Azure Static Web Apps, AWS S3 + CloudFront, Vercel, Netlify)

## Environment Variables

### Backend (`Pos.Api`)

| Variable | Description | Example |
|----------|-------------|---------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string | `Host=db.example.com;Database=pos;Username=pos;Password=***` |
| `Jwt__Secret` | JWT signing key (min 32 chars) | Strong random string |
| `Jwt__Issuer` | Token issuer | `PosApi` |
| `Jwt__Audience` | Token audience | `PosClients` |
| `Jwt__ExpiryMinutes` | Access token lifetime | `60` |
| `Cors__Origins__0` | Allowed frontend origin | `https://pos.example.com` |
| `Cors__Origins__1` | Second frontend origin | `https://admin.example.com` |
| `ASPNETCORE_ENVIRONMENT` | Environment name | `Production` |

### Frontend (build-time)

Set these when building each Vite app:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://api.example.com` |

Build commands:

```bash
cd frontend
VITE_API_URL=https://api.example.com npm run build -w @pos/pos-terminal
VITE_API_URL=https://api.example.com npm run build -w @pos/admin-portal
```

Deploy the `dist/` folders from each app to your static host.

## Docker Deployment (Backend)

Example `Dockerfile` for the API:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY backend/ .
RUN dotnet restore src/Pos.Api/Pos.Api.csproj
RUN dotnet publish src/Pos.Api/Pos.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Pos.Api.dll"]
```

Run database migrations before or during deployment:

```bash
dotnet ef database update --project Pos.Infrastructure --startup-project Pos.Api
```

## PostgreSQL (Managed)

1. Provision a PostgreSQL 14+ instance
2. Create database and user with appropriate permissions
3. Set `ConnectionStrings__DefaultConnection` on the API host
4. Run EF migrations
5. Disable or protect the data seeder in production (it only runs in Development)

## SSL / HTTPS

- Terminate TLS at a reverse proxy or load balancer
- Ensure CORS origins use `https://` in production
- JWT tokens must only be transmitted over HTTPS

## POS Terminal (PWA / Kiosk)

For in-store deployment:

1. Build the POS terminal with the production API URL
2. Serve over HTTPS (required for PWA and secure token storage)
3. Install as a PWA on the device or use kiosk mode
4. Configure the device to auto-launch the POS URL on startup

## Admin Portal

Deploy separately from the POS terminal on a different subdomain (e.g., `admin.example.com`). Restrict access via:

- Network policies (VPN, IP allowlist)
- Strong passwords and role-based access (OrgAdmin)

## Monitoring

Recommended additions for production:

- Application Insights / Datadog for API telemetry
- PostgreSQL slow query logging
- Uptime checks on `/swagger` or a health endpoint
- Audit log review via Admin Portal

## Scaling

| Component | Strategy |
|-----------|----------|
| API | Horizontal scaling behind load balancer; stateless JWT auth |
| PostgreSQL | Vertical scaling or read replicas for reporting |
| Frontend | CDN for static assets; cache `index.html` with short TTL |
| Offline sync | Outbox queue on client handles transient API unavailability |

## Security Checklist

- [ ] Rotate `Jwt__Secret` from development default
- [ ] Use strong database credentials
- [ ] Configure CORS to exact production origins only
- [ ] Enable HTTPS everywhere
- [ ] Review user roles before granting OrgAdmin
- [ ] Set up database backups
- [ ] Remove Swagger in production (or protect with auth)
