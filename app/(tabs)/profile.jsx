import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GlobalContext } from '../../context/GlobalProvider';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { auth } from '../../firebase';
import { getUserData } from '../../components/crud';

const profile = () => {
  const {setIsLoading} = useContext(GlobalContext);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await getUserData(auth.currentUser.uid);
        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data: ", error);
      } finally {
        setIsLoading(false);
      }
    
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    
    try {
      setIsLoading(true);
      
      await auth.signOut();

      // router.dismissAll();
      router.replace("/login");
      console.log("User has been logged out successfully");
    } catch (error) {
      console.error("Error during logout: ", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    user ? (
        <SafeAreaView style={styles.container}>
          <ScrollView>
            <View style={styles.header}>
              <Text style={styles.headerText}>Profile</Text>
            </View>
            <View style={styles.profileSection}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{user.name}</Text>
            </View>
            <View style={styles.profileSection}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <View style={styles.profileSection}>
              <Text style={styles.label}>Username:</Text>
              <Text style={styles.value}>{user.username}</Text>
            </View>
            <View style={styles.profileSection}>
              <Text style={styles.label}>Job:</Text>
              <Text style={styles.value}>{user.job}</Text>
            </View>
            <View style={styles.profileSection}>
              <Text style={styles.label}>Phone Number:</Text>
              <Text style={styles.value}>{user.phoneNumber}</Text>
            </View>
            <Button
              mode="contained"
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              Logout
            </Button>
          </ScrollView>
        </SafeAreaView>
      ) : (
        <View style={styles.error} >
          <Text style ={styles.errorText} >No Profile to show</Text>
          <Text style ={styles.errorText} >Do login or sign up before coming here</Text>
        </View>
      )
    
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
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    color: "red",
  },
})