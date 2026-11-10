import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Money Manager - ניהול תיק השקעות',
    short_name: 'MoneyManager',
    description: 'מערכת חכמה לניהול תיק השקעות ומעקב תשואות, דיבידנדים ומזומן',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

