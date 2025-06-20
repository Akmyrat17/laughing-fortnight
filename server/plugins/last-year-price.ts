import axios from "axios"
import { db } from "~/lib/db"
import { logger } from "~/lib/logger"
import { bitcoinPrice } from "~/lib/schema"

export default defineNitroPlugin(async () => {
    await getYearAgoTimestamp()
})

async function getYearAgoTimestamp() {
    logger.info('Getting prices for last year')
    const { coingeckoUrl } = useRuntimeConfig()
    const res = await axios.get(coingeckoUrl, {
        params: {
            days: 365,
        },
    })
    let pricesByDate = []
    for (let i = 0; i < res.data.prices.length; i++) {
        const element = res.data.prices[i];
        pricesByDate.push({
            timestamp: element[0],
            priceUSD: element[1]
        })
    }
    const addToDb = pricesByDate.slice(0, -2)

    await db
        .insert(bitcoinPrice)
        .values(
            addToDb.map(({ timestamp, priceUSD }) => ({
                timestamp: timestamp,
                priceUSD: priceUSD,
            }))
        )
        .onConflictDoNothing();
    logger.info('Done getting prices for last year')
}