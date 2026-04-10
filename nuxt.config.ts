// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  nitro: {
    preset: 'cloudflare_module',
  },
  runtimeConfig: {
    egovClientSecret: '',
    public: {
      egovClientId: '',
      egovRedirectUri: '',
      egovAuthBase: 'https://account2.sbx.e-gov.go.jp/auth',
      egovApiBase: 'https://api2.sbx.e-gov.go.jp/shinsei/v2',
    },
  },
})
