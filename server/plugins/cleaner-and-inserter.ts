import axios from "axios"
import dayjs from "dayjs"
import { useScheduler } from "#scheduler"
import { and, asc, eq, gte, inArray, lt, lte } from "drizzle-orm"
import { db } from "~/lib/db"
import { bitcoinPrice } from "~/lib/schema"
import { logger } from "~/lib/logger"


export default defineNitroPlugin(async () => {
    useScheduler().run(async () => {
        await runScheduler()
    }).everyHours(1)
})

async function runScheduler() {
    logger.info('Running scheduler... (1 hour)')
    const now = dayjs()
    const nowUnix = now.valueOf() // in ms

    // === 1. INSERT HOURLY PRICE FOR CURRENT HOUR ===
    const [alreadyExists] = await db
        .select()
        .from(bitcoinPrice)
        .where(eq(bitcoinPrice.timestamp, BigInt(nowUnix)))
        .limit(1);


    if (!alreadyExists) {
        const { timestamp, priceUSD } = await getBitcoinPrice();
        await db
            .insert(bitcoinPrice)
            .values({
                timestamp,
                priceUSD,
            });
    }


    // === 2. DELETE DATA OLDER THAN 1 YEAR ===
    const oneYearAgo = now.subtract(1, 'year').startOf('day').valueOf()

    await db
        .delete(bitcoinPrice)
        .where(lt(bitcoinPrice.timestamp, BigInt(oneYearAgo)));


    // === 3. KEEP 1/DAY FOR THIS MONTH (EXCEPT TODAY) ===
    const startOfMonth = now.startOf('month')
    const today = now.startOf('day')

    const daysInMonth = now.date()

    for (let i = 1; i < daysInMonth; i++) {
        const day = startOfMonth.add(i - 1, 'day')
        if (day.isSame(today, 'day')) continue

        const start = day.startOf('day').valueOf()
        const end = day.endOf('day').valueOf()

        const dayPrices = await db
            .select()
            .from(bitcoinPrice)
            .where(
                and(
                    gte(bitcoinPrice.timestamp, BigInt(start)),
                    lte(bitcoinPrice.timestamp, BigInt(end))
                )
            )
            .orderBy(asc(bitcoinPrice.timestamp));

        if (dayPrices.length > 1) {
            const idsToDelete = dayPrices.slice(1).map(p => p.id);

            await db
                .delete(bitcoinPrice)
                .where(inArray(bitcoinPrice.id, idsToDelete));
        }
    }

    // === 4. KEEP 1/MONTH FOR PREVIOUS MONTHS WITHIN 1 YEAR ===
    for (let i = 1; i <= 11; i++) {
        const targetMonth = now.subtract(i, 'month')

        const start = targetMonth.startOf('month').valueOf()
        const end = targetMonth.endOf('month').valueOf()

        const prices = await db
            .select()
            .from(bitcoinPrice)
            .where(
                and(
                    gte(bitcoinPrice.timestamp, BigInt(start)),
                    lte(bitcoinPrice.timestamp, BigInt(end))
                )
            )
            .orderBy(asc(bitcoinPrice.timestamp));

        if (prices.length > 1) {
            const idsToDelete = prices.slice(1).map(p => p.id);

            await db
                .delete(bitcoinPrice)
                .where(inArray(bitcoinPrice.id, idsToDelete));
        }
    }

    logger.info(`[✓] Cleanup done at ${now.format()}`)
    return {
        success: true,
    }
}

async function getBitcoinPrice() {
    const { coingeckoUrl } = useRuntimeConfig()
    const res = await axios.get(coingeckoUrl, {
        params: {
            days: '1',
        }
    })
    return res.data.prices[res.data.prices.length - 1]
}