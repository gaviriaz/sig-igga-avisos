import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-auto-icon.svg', 'icon-512.png'],
            manifest: {
                name: 'SIG IGGA/ISA - Gestión de Avisos',
                short_name: 'SIG-Avisos',
                description: 'Sistema SIG Empresarial para Gestión de Avisos con modo Offline',
                theme_color: '#0f172a',
                icons: [
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/db\.vdzfamjklmwlptitxvvd\.supabase\.co\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'supabase-api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/sig-igga-avisos\.onrender\.com\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'render-backend-cache',
                            expiration: {
                                maxEntries: 500,
                                maxAgeSeconds: 60 * 60 * 24 * 3 // 3 días
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
