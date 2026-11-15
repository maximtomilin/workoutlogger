import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

function icon(active: IconName, inactive: IconName) {
  return function TabIcon({
    color,
    size,
    focused,
  }: {
    color: ColorValue;
    size: number;
    focused: boolean;
  }) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color as string} />;
  };
}

export default function TabsLayout() {
  return (
    <Tabs
        screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#111',
            tabBarInactiveTintColor: '#999',
            tabBarShowLabel: false,
            tabBarStyle: { height: 85, paddingTop: 8 },
        }}
        >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="exercisesScreen"
        options={{ title: 'Exercises', tabBarIcon: icon('barbell', 'barbell-outline') }}
      />
      <Tabs.Screen
        name="historyScreen"
        options={{ title: 'History', tabBarIcon: icon('time', 'time-outline') }}
      />
    </Tabs>
  );
}