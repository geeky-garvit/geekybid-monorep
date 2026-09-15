import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest { return { name: 'GeekyBid', short_name: 'GeekyBid', description: 'A local-first auction marketplace', start_url: '/', display: 'standalone', background_color: '#f8fafc', theme_color: '#581c87', icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }] }; }
