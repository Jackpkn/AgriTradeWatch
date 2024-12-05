import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useContext } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GlobalContext } from '../../context/GlobalProvider';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

const profile = () => {
  const {mainUser, setMainUser, setJwt, setIsLogged, setIsLoading} = useContext(GlobalContext);

  const handleLogout = async () => {
    
    try {
      setIsLoading(true);
      // Remove the JWT from AsyncStorage
      await AsyncStorage.removeItem('jwt');
      setIsLogged(false);
      setMainUser({});
      setJwt('');

      router.dismissAll();
      router.replace('/login');
      console.log("User has been logged out successfully");
    } catch (error) {
      console.error("Error during logout: ", error);
    } finally {
      setTimeout(() => {
        setJwt('');
      }, 2000);
      setIsLoading(false);
    }
  }

  return (

    <SafeAreaView>
      <ScrollView contentContainerStyle={{ width: "100%" }} >

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Profile</Text>
        </View>
        <View style={styles.profileSection}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{mainUser.name}</Text>
        </View>
        <View style={styles.profileSection}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}> {mainUser.email} </Text>
        </View>
        <View style={styles.profileSection}>
          <Text style={styles.label}>Role:</Text>
          <Text style={styles.value}>{mainUser.job}</Text>
        </View>
      </View>

      <View style={styles.logoutButton}>
        <Button mode='contained' style={{backgroundColor: "#1F4E3D"}} textColor="white" onPress={handleLogout} >
          Logout
        </Button>
      </View>

      </ScrollView>

    </SafeAreaView>
    
  )
}

export default profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
  },
  value: {
    fontSize: 18,
  },
  logoutButton: {
    marginTop: 20,
    width: "50%",
    marginHorizontal: "auto",
    
  },
})