import axios from "axios"
import { db } from "~/lib/db"
import { logger } from "~/lib/logger"
import { bitcoinPrice } from "~/lib/schema"

export default defineNitroPlugin(async () => {
    await getMonthAgoTimestamp()
})

async function getMonthAgoTimestamp() {
    logger.info('Getting prices for last month')
    const { coingeckoUrl } = useRuntimeConfig()
    try {
        const res = await axios.get(coingeckoUrl, {
            params: {
                days: 2,
            },
        })
        let pricesByHour = []
        for (let i = 0; i < res.data.prices.length; i++) {
            const element = res.data.prices[i];
            pricesByHour.push({
                timestamp: element[0],
                priceUSD: element[1]
            })
        }

        const addToDb = pricesByHour.slice(24, -1)
        await db
            .insert(bitcoinPrice)
            .values(
                addToDb.map(({ timestamp, priceUSD }) => ({
                    timestamp: timestamp,
                    priceUSD: priceUSD,
                }))
            )
            .onConflictDoNothing();
        logger.info('Done getting prices for last month')
    } catch (error) {
        logger.error(error)
    }
}