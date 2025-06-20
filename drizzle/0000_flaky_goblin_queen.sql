CREATE TABLE "bitcoin_price" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" bigint NOT NULL,
	"price_usd" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
