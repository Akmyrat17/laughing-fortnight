import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './lib/schema.ts',
    out: './drizzle',
    dialect: 'postgresql', // 'postgresql' | 'mysql' | 'sqlite'
    dbCredentials: {
        host: process.env.DATABASE_HOST!,
        port: Number(process.env.DATABASE_PORT),
        user: process.env.DATABASE_USER!,
        password: process.env.DATABASE_PASSWORD!,
        database: process.env.DATABASE_NAME!,
        ssl: false
    }
});

