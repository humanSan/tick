import React from 'react';
import { Dimensions } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Timer, List, CheckSquare } from 'lucide-react-native';
import { Colors, FontSize } from '../../src/theme';

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: false,
          swipeEdgeWidth: Dimensions.get('window').width,
          drawerStyle: {
            backgroundColor: Colors.surface,
            width: 280,
          },
          drawerActiveTintColor: Colors.primary,
          drawerInactiveTintColor: Colors.textSecondary,
          drawerActiveBackgroundColor: Colors.surfaceElevated,
          drawerLabelStyle: {
            fontFamily: 'DMSans_500Medium',
            fontSize: FontSize.md,
            marginLeft: -8,
          },
          drawerItemStyle: {
            borderRadius: 12,
            marginHorizontal: 8,
            marginVertical: 2,
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: 'Stopwatch',
            drawerIcon: ({ color, size }) => (
              <Timer size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="sessions"
          options={{
            title: 'Sessions',
            drawerIcon: ({ color, size }) => (
              <List size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            drawerIcon: ({ color, size }) => (
              <CheckSquare size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
