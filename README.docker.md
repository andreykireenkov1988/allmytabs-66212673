# AllMyTabs - Self-Hosted Docker Deployment

This guide will help you deploy AllMyTabs on your Mac Mini using Docker.

## Prerequisites

- Docker Desktop installed on your Mac Mini
- Git installed
- At least 4GB of RAM available for Docker

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/allmytabs.git
cd allmytabs
```

### 2. Generate secrets

Run these commands to generate secure secrets:

```bash
# Generate PostgreSQL password
openssl rand -base64 24

# Generate JWT secret (must be at least 32 characters)
openssl rand -base64 32

# Generate Secret Key Base for Realtime
openssl rand -base64 64
```

### 3. Create environment file

```bash
cp .env.example .env.docker
```

Edit `.env.docker` and replace the placeholder values with your generated secrets.

### 4. Generate Supabase API Keys

Use the JWT secret you generated to create API keys. You can use this online tool:
https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

Or generate them manually with the JWT secret.

### 5. Start the stack

```bash
docker-compose --env-file .env.docker up -d
```

### 6. Access the application

- **AllMyTabs App**: http://localhost:3000
- **Supabase API**: http://localhost:8000
- **MailHog (email testing)**: http://localhost:8025
- **PostgreSQL**: localhost:5432

## Services

| Service | Port | Description |
|---------|------|-------------|
| allmytabs | 3000 | Main web application |
| kong | 8000 | API Gateway |
| db | 5432 | PostgreSQL database |
| auth | 9999 | Supabase Auth (internal) |
| rest | 3000 | PostgREST API (internal) |
| realtime | 4000 | Realtime subscriptions (internal) |
| storage | 5000 | File storage (internal) |
| mailhog | 8025 | Email testing UI |

## Management

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f allmytabs
docker-compose logs -f db
```

### Stop the stack

```bash
docker-compose down
```

### Stop and remove all data

```bash
docker-compose down -v
```

### Rebuild after code changes

```bash
docker-compose build allmytabs
docker-compose up -d
```

## Email Configuration

By default, emails are caught by MailHog for testing. View them at http://localhost:8025.

For production, update these variables in `.env.docker`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_ADMIN_EMAIL=your-email@gmail.com
SMTP_SENDER_NAME=AllMyTabs
```

## Backup

### Backup database

```bash
docker-compose exec db pg_dump -U postgres postgres > backup.sql
```

### Restore database

```bash
cat backup.sql | docker-compose exec -T db psql -U postgres postgres
```

## Troubleshooting

### Database connection issues

```bash
# Check if database is healthy
docker-compose exec db pg_isready

# Check database logs
docker-compose logs db
```

### Auth issues

```bash
# Check auth service logs
docker-compose logs auth
```

### Rebuild everything from scratch

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Security Notes

1. **Never commit `.env.docker`** to version control
2. Generate unique secrets for production
3. Consider using a reverse proxy with SSL for production
4. Regularly backup your database
5. Keep Docker images updated

## Updating

```bash
git pull
docker-compose build allmytabs
docker-compose up -d
```
