# 📈 Bitcoin Tracker (Nuxt 3 + Drizzle + PostgreSQL + Docker)

A Simple, one page, containerized Nuxt 3 application with a PostgreSQL backend, using Drizzle ORM for type-safe database interaction.

## 🧰 Tech Stack

- [Nuxt 3](https://nuxt.com/) — Frontend & SSR
- [Drizzle ORM](https://orm.drizzle.team/) — Type-safe SQL and migrations
- [PostgreSQL](https://www.postgresql.org/) — Relational database
- [Docker](https://www.docker.com/) — Containerization
- `wait-for-it.sh` — Ensures DB is ready before migrations run

---

## 🚀 What It Does

This project:

- Connects Nuxt's server-side API to PostgreSQL using Drizzle ORM
- Automatically runs migrations on container startup
- Cleanly separates frontend and backend logic
- Uses environment variables for configuration
- Exposes Nuxt app on `localhost:${NUXT_PORT}`

---

## 📦 Project Structure

```bash
.
├── components/             # Vue components
├── drizzle/                # Drizzle migration files
├── lib/                    # Database logic (schema, client, logger)
├── pages/                  # Nuxt pages
├── public/                 # Static assets
├── server/                # API routes (server-side logic)
├── .env                    # Environment variables
├── docker-compose.yml      # Multi-service setup
├── Dockerfile              # Single-stage Docker build
├── drizzle.config.ts       # Drizzle ORM config
├── wait-for-it.sh          # DB wait script
```

## 🐳 Running the App

Run the following two commands:

```bash
# 1. Build images
docker-compose build

# 2. Start containers
docker-compose up
```

## Page

Go to the link to see the prices

**http://localhost:{PORT}/bitcoin**
