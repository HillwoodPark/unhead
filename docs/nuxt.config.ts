export default defineNuxtConfig({
  extends: [
    '@nuxt-themes/docus',
    'nuxt-seo-kit'
  ],

  workspaceDir: './',

  runtimeConfig: {
    public: {
      indexable: true,
      siteUrl: 'https://unhead.harlanzw.com/',
      trailingSlash: false,
      locale: 'en',
    }
  },

  modules: [
    'nuxt-windicss',
    'nuxt-og-image',
  ],

  ogImage: {
    host: 'https://unhead.harlanzw.com',
  },

  hooks: {
    'nitro:init'(nitro) {
      // prev [/[/\\]node_modules[/\\]/, /[/\\]\.git[/\\]/],
      nitro.options.imports.exclude = [/[/\\]\.git[/\\]/]
    }
  },

  app: {
    head: {
      link: [
        { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml', media: '(prefers-color-scheme:no-preference)' },
        { rel: 'icon', href: '/logo-dark.svg', type: 'image/svg+xml', media: '(prefers-color-scheme:dark)' },
        { rel: 'icon', href: '/logo-light.svg', type: 'image/svg+xml', media: '(prefers-color-scheme:light)' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com', crossorigin: true },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
      ],
      script: [
        {
          'src': 'https://cdn.usefathom.com/script.js',
          'data-spa': 'auto',
          'data-site': 'BRDEJWKJ',
          'defer': true,
        },
      ],
    },
  },

  fontMetrics: {
    fonts: ['Inter'],
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ],
    },
  },
})
