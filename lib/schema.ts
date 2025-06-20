import { pgTable, serial, bigint, real, timestamp } from 'drizzle-orm/pg-core';

export const bitcoinPrice = pgTable('bitcoin_price', {
    id: serial('id').primaryKey(),
    timestamp: bigint('timestamp', { mode: 'bigint' }).notNull(),
    priceUSD: real('price_usd').notNull(), // or use decimal() for more precision
    createdAt: timestamp('created_at').defaultNow(),
});
