import { defineNuxtConfig } from 'nuxt/config'; // Ensure this import is there

export default defineNuxtConfig({
  devtools: { enabled: true },
  devServer: {
    port: Number(process.env.NUXT_PORT) || 3000,
  },

  modules: ['@nuxtjs/tailwindcss', 'nuxt-scheduler'],
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      autoprefixer: {},
    },
  },
  runtimeConfig: {
    coingeckoUrl: process.env.COINGECKO_URL,
    coingeckoHomeUrl: process.env.COINGECKO_HOME_URL,
  },
  // nitro: {
  //   compatibilityDate: '2025-06-19',
  //   externals: {
  //     external: ['@prisma/client'],
  //   },
  // },
});