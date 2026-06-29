import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getActiveHousehold } from '@/services/households';
import { logError } from '@/utils/safeLogger';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [checkingHousehold, setCheckingHousehold] = useState(true);
  const [hasHousehold, setHasHousehold] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getActiveHousehold()
      .then((household) => {
        if (isMounted) setHasHousehold(!!household);
      })
      .catch((error) => {
        logError("Failed to check household", error);
        if (isMounted) setHasHousehold(false);
      })
      .finally(() => {
        if (isMounted) setCheckingHousehold(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (checkingHousehold) {
    return (
      <View style={{ alignItems: 'center', backgroundColor: '#FAF6EE', flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color="#A85C44" />
      </View>
    );
  }

  if (!hasHousehold) {
    return <Redirect href="/household" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopColor: '#E8DECE',
        },
        tabBarLabelStyle: {
          fontWeight: '700',
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
