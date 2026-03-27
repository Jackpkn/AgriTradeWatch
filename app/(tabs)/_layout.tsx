import React from "react";
import { View, Text, ViewStyle, TextStyle } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";

interface TabIconProps {
  icon: string;
  color: string;
  name: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, color, name, focused }) => {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        height: 50,
        paddingVertical: 5,
      } as ViewStyle}
    >
      <Ionicons
        name={icon as any}
        size={focused ? 28 : 24}
        color={color}
        style={{ fontWeight: "bold" } as TextStyle}
      />
      <Text
        style={{
          fontSize: 10,
          color,
          marginTop: 4,
          fontWeight: focused ? "600" : "400",
        }}
      >
        {name}
      </Text>
    </View>
  );
};

// Simple type for tabBarIcon parameters
interface TabBarIconProps {
  color: string;
  focused: boolean;
  size: number;
}

const TabLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#49A760",
        tabBarInactiveTintColor: "#BDBDBD",
        tabBarStyle: {
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E5E5",
        },
        tabBarItemStyle: {
          height: 60,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.nav.home,
          headerShown: false,
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <TabIcon icon="home" name={t.nav.home} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t.nav.stats,
          headerShown: false,
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <TabIcon
              icon="stats-chart"
              name={t.nav.stats}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t.nav.map,
          headerShown: false,
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <TabIcon icon="map" name={t.nav.map} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.nav.profile,
          headerShown: false,
          tabBarIcon: ({ color, focused }: TabBarIconProps) => (
            <TabIcon
              icon="person"
              name={t.nav.profile}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
