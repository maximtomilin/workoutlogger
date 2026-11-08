import { Slot } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>Workout Logger</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <SafeAreaProvider>
        <Slot />
      </SafeAreaProvider>
    </>
  );
}