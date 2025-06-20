import dayjs from "dayjs"
import { gte, and, lte, asc } from "drizzle-orm"
import { db } from "~/lib/db"
import { logger } from "~/lib/logger"
import { bitcoinPrice } from "~/lib/schema"

export default defineEventHandler(async (event) => {
    logger.info('Incoming request to get data. Range: ', getRequestURL(event).searchParams.get('range'));
    const query = getQuery(event)

    const { coingeckoHomeUrl } = useRuntimeConfig()

    const range = query.range as string
    const customFrom = query.from ? Number(query.from) : undefined
    const customTo = query.to ? Number(query.to) : undefined

    const { from, to } = getRangeTimestamps(range, customFrom, customTo)
    const prices = await db
        .select({
            timestamp: bitcoinPrice.timestamp,
            priceUSD: bitcoinPrice.priceUSD,
        })
        .from(bitcoinPrice)
        .where(
            and(
                gte(bitcoinPrice.timestamp, BigInt(from)),
                lte(bitcoinPrice.timestamp, BigInt(to))
            )
        )
        .orderBy(asc(bitcoinPrice.timestamp));
    return {
        success: true,
        sourceLink: coingeckoHomeUrl,
        data: groupByRange(range, prices),
    }
})

function getRangeTimestamps(range: string, customFrom?: number, customTo?: number) {
    const now = Date.now()
    switch (range) {
        case '1d':
            return {
                from: dayjs(now).subtract(1, 'day').startOf('day').valueOf(),
                to: dayjs(now).endOf('day').valueOf(),
            }
        case '1w':
            return {
                from: dayjs(now).subtract(7, 'day').startOf('day').valueOf(),
                to: dayjs(now).endOf('day').valueOf(),
            }
        case '1m':
            return {
                from: dayjs(now).subtract(30, 'day').startOf('day').valueOf(),
                to: dayjs(now).endOf('day').valueOf(),
            }
        case '1y':
            return {
                from: dayjs(now).subtract(1, 'year').startOf('day').valueOf(),
                to: dayjs(now).endOf('day').valueOf(),
            }
        case 'custom':
            if (!customFrom || !customTo) {
                throw createError({ statusCode: 400, statusMessage: 'Custom range needs from and to' })
            }
            return {
                from: dayjs(customFrom).startOf('day').valueOf(),
                to: dayjs(customTo).endOf('day').valueOf(),
            }
        default:
            throw createError({ statusCode: 400, statusMessage: 'Invalid range' })
    }
}

function groupByRange(range: string, data: { timestamp: bigint, priceUSD: number }[]) {
    let returnData: { date: String | Date; priceUSD: number }[] = []
    switch (range) {
        case '1d':
            data.forEach((point) => {
                const formatted = dayjs(Number(point.timestamp)).format('YYYY.MM.DD HH:mm')
                returnData.push({
                    date: formatted,
                    priceUSD: point.priceUSD
                })
            })
            while (returnData.length > 24) {
                returnData.shift()
            }
            break;
        case '1m':
            const lastDay = data.slice(-24).reduce((a, b) => a + b.priceUSD, 0) / 24
            const midnight = new Date()
            midnight.setHours(0, 0, 0, 0)
            for (let i = 0; i < 4; i++) {
                const dayCount = 7
                const startDay = dayCount * i
                const weekDays = data.slice(startDay, startDay + dayCount)
                const average = weekDays.reduce((a, b) => a + b.priceUSD, 0) / dayCount
                returnData.push({
                    date: dayjs(Number(weekDays[0].timestamp)).format('YYYY.MM.DD'),
                    priceUSD: average
                })
            }
            returnData.push({
                date: dayjs(Number(midnight)).format('YYYY.MM.DD'),
                priceUSD: lastDay
            })
            break;
        case '1w':
            const lastDayAvarage = data.slice(-25).reduce((a, b) => a + b.priceUSD, 0) / 24
            for (let i = 0; i < 7; i++) {
                if (i === 6) {
                    const formatted = dayjs(Number(data[7].timestamp)).format('YYYY.MM.DD')
                    returnData.push({
                        date: formatted,
                        priceUSD: lastDayAvarage
                    })
                } else {
                    const formatted = dayjs(Number(data[i].timestamp)).format('YYYY.MM.DD')
                    returnData.push({
                        date: formatted,
                        priceUSD: data[i].priceUSD
                    })
                }
            }
            break;
        case '1y':
            const monthlyMap = new Map<string, number[]>()

            for (const item of data) {
                const date = dayjs(Number(item.timestamp)).format('YYYY.MM')
                if (!monthlyMap.has(date)) {
                    monthlyMap.set(date, [])
                }
                monthlyMap.get(date)!.push(item.priceUSD)
            }

            for (const [date, prices] of monthlyMap.entries()) {
                const avg = prices.reduce((sum, val) => sum + val, 0) / prices.length
                returnData.push({
                    date,
                    priceUSD: Number(avg.toFixed(2)),
                })
            }
            break
        default:
            const dailyMap = new Map<string, number[]>()

            for (const item of data) {
                const dateKey = dayjs(Number(item.timestamp)).format('YYYY.MM.DD') // e.g. "2025.06.19"
                if (!dailyMap.has(dateKey)) {
                    dailyMap.set(dateKey, [])
                }
                dailyMap.get(dateKey)!.push(item.priceUSD)
            }

            for (const [date, prices] of dailyMap.entries()) {
                const avg = prices.reduce((sum, val) => sum + val, 0) / prices.length
                returnData.push({
                    date,
                    priceUSD: Number(avg.toFixed(2)),
                })
            }
            break;
    }
    return returnData
}
