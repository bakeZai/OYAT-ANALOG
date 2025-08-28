/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем строгий режим для предотвращения двойных вызовов в development
  reactStrictMode: false,
  
  // Игнорируем ошибки TypeScript во время сборки
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Добавляем переменные окружения, которые будут доступны на стороне клиента
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  
  // Экспериментальные настройки (если они нужны)
  experimental: {
    // Другие экспериментальные настройки
  },
  
  // Настройки для изображений
  images: {
    domains: ['your-supabase-url.supabase.co'], // Добавьте ваш Supabase URL
  },
};

module.exports = nextConfig;
