import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useHifeTheme } from '@/hooks/use-hife-theme';
import { getActiveHousehold } from '@/services/households';
import { logError } from '@/utils/safeLogger';

export default function TabLayout() {
  const { palette } = useHifeTheme();
  const isPreview =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('preview');
  const [checkingHousehold, setCheckingHousehold] = useState(true);
  const [hasHousehold, setHasHousehold] = useState(false);
  const [householdCheckFailed, setHouseholdCheckFailed] = useState(false);

  useEffect(() => {
    if (isPreview) {
      setHasHousehold(true);
      setCheckingHousehold(false);
      return;
    }

    let isMounted = true;

    setCheckingHousehold(true);
    setHouseholdCheckFailed(false);
    getActiveHousehold()
      .then((household) => {
        if (isMounted) setHasHousehold(!!household);
      })
      .catch((error) => {
        logError("Failed to check household", error);
        if (isMounted) setHouseholdCheckFailed(true);
      })
      .finally(() => {
        if (isMounted) setCheckingHousehold(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isPreview]);

  if (checkingHousehold) {
    return (
      <View style={{ alignItems: 'center', backgroundColor: palette.background, flex: 1, justifyContent: 'center', padding: 24 }}>
        <ActivityIndicator color={palette.primary} />
        <Text style={{ color: palette.mutedText, fontSize: 13, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
          Checking your Hife room
        </Text>
      </View>
    );
  }

  if (householdCheckFailed) {
    return (
      <View style={{ alignItems: 'center', backgroundColor: palette.background, flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: palette.text, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
          Could not check your room
        </Text>
        <Text style={{ color: palette.mutedText, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' }}>
          Your room data is not changed. Try again before setting up a new room.
        </Text>
        <Pressable
          style={{ alignItems: 'center', backgroundColor: palette.primary, borderRadius: 8, justifyContent: 'center', marginTop: 16, minHeight: 46, paddingHorizontal: 18 }}
          onPress={() => {
            setCheckingHousehold(true);
            setHouseholdCheckFailed(false);
            getActiveHousehold()
              .then((household) => setHasHousehold(!!household))
              .catch((error) => {
                logError("Failed to retry household check", error);
                setHouseholdCheckFailed(true);
              })
              .finally(() => setCheckingHousehold(false));
          }}
        >
          <Text style={{ color: palette.buttonText, fontSize: 14, fontWeight: '900' }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!hasHousehold) {
    return <Redirect href="/household" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.tabInactive,
        tabBarStyle: {
          backgroundColor: palette.chrome,
          borderTopColor: palette.border,
          height: 78,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
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
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
