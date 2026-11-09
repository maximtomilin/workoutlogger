import { useEffect } from 'react';
import { Slot } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js')
      .catch((e) => console.warn('Service worker registration failed', e));
  }, []);

  return (
    <>
      <Head>
        <title>Workout Logger</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111111" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </Head>
      <SafeAreaProvider>
        <Slot />
      </SafeAreaProvider>
    </>
  );
}