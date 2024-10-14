import { View, Text, Image } from "react-native";
import { Tabs, Redirect } from "expo-router";
// import {home} from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/Ionicons';


const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View style={{ alignItems:"center", justifyContent:"center" }}>
      <Icon name={icon} size={ focused ? 35 : 30} color={color} style={{fontWeight:'bold', }} />
      {/* <Text>{name}</Text> */}
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
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({color, focused})=>( <TabIcon icon='home' name="Home" color={color} focused={focused} /> ),
          }}
        />
        <Tabs.Screen
          name="notification"
          options={{
            title: "Notifications",
            headerShown: false,
            tabBarIcon: ({color, focused})=>( <TabIcon icon="notifications" name="Home" color={color} focused={focused} /> ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({color, focused})=>( <TabIcon icon="person" name="Home" color={color} focused={focused} /> ),
          }}
        />
      </Tabs>
    </>
  );
};

export default TabLayout;
