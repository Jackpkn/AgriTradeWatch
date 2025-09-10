import { View, Text, Image } from "react-native";
import { Tabs, Redirect } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View style={{ 
      alignItems: "center", 
      justifyContent: "center",
      height: 50, 
      paddingVertical: 5,
    }}>
      <Icon
        name={icon}
        size={focused ? 28 : 24} 
        color={color}
        style={{ fontWeight: "bold" }}
      />
      <Text style={{ 
        fontSize: 10, 
        color: color, 
        marginTop: 4,
        fontWeight: focused ? '600' : '400'
      }}>
        {name}
      </Text>
    </View>
  );
};

const TabLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#49A760",
          tabBarInactiveTintColor: "#BDBDBD",
          tabBarStyle: {
            height: 80, // Set explicit height
            paddingBottom: 10, // Add padding for better spacing
            paddingTop: 10,
            backgroundColor: '#FFFFFF', // Ensure background color
            borderTopWidth: 1,
            borderTopColor: '#E5E5E5',
          },
          tabBarItemStyle: {
            height: 60, // Set item height
            justifyContent: 'center',
            alignItems: 'center',
          }
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="home"
                name="Home"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Statistics",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="stats-chart"
                name="Stats"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon 
                icon="map" 
                name="Map" 
                color={color} 
                focused={focused} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon="person"
                name="Profile"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
};

export default TabLayout;