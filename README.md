# be-sso — SSO Portal & Yellow Pages API

Centralized SSO portal + Yellow Pages directory. Express + Prisma 7 + PostgreSQL

## Stack
- Node 20, TypeScript, Express 5
- Prisma 7 (`prisma-client` output to `src/generated/prisma`, `prisma.config.ts`, `@prisma/adapter-pg`)
- PostgreSQL 16 (Docker, host port **5433** )
- JWT (`jsonwebtoken` + `bcryptjs`), Swagger (`swagger-ui-express` + `swagger-jsdoc`), Zod installed for future validation

## Prerequisites
- Docker & Docker Compose
- Node 20+
- `DATABASE_URL` pointing to Postgres on 5433

## Quick Start

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

> `src/generated/prisma` is not committed — run `npx prisma generate` after `npm install` or after copying the project.

## Env

See `.env.example`:

| Key | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection | `postgresql://user:***@localhost:5433/mydb?schema=public` |
| `JWT_SECRET` | JWT signing secret | `thisisjwt` |
| `PORT` | API port (optional) | `3000` |

## Docs

Swagger at `http://localhost:3000/docs` when running.
