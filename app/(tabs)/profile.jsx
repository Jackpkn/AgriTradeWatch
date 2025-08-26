import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { GlobalContext } from '../../context/GlobalProvider';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { auth } from '../../firebase';
import { getUserData } from '../../components/crud';

const profile = () => {
  const { setIsLoading } = useContext(GlobalContext);

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

  const handleLogout = React.useCallback(async () => {
    try {
      setIsLoading(true);
      await auth.signOut();
      router.replace("/login");
      console.log("User has been logged out successfully");
    } catch (error) {
      console.error("Error during logout: ", error);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading]);

  return (
    user ? (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{user.name ? user.name[0].toUpperCase() : '?'}</Text>
              </View>
            </View>
            <Text style={styles.headerText}>Profile</Text>
            <View style={styles.infoSection}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Name</Text>
              </View>
              <View style={{ flex: 2, paddingLeft: 12 }}>
                <Text style={styles.value}>{user.name}</Text>
              </View>
            </View>
            <View style={styles.infoSection}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Email</Text>
              </View>
              <View style={{ flex: 2, paddingLeft: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
                  <Text style={[styles.value, { flexShrink: 1 }]}>{user.email}</Text>
                </ScrollView>
              </View>
            </View>
            <View style={styles.infoSection}>
              <View>
                <Text style={styles.label}>Username</Text>
              </View>
              <View style={{ flex: 2, paddingLeft: 12 }}>
                <Text style={styles.value}>{user.username}</Text>
              </View>
            </View>
            <View style={styles.infoSection}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Job</Text>
              </View>
              <View style={{ flex: 2, paddingLeft: 12 }}>
                <Text style={styles.value}>{user.job}</Text>
              </View>
            </View>
            <View style={styles.infoSection}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Phone Number</Text>
              </View>
              <View style={{ flex: 2, paddingLeft: 12 }}>
                <Text style={styles.value}>{user.phoneNumber}</Text>
              </View>
            </View>
            <Button
              mode="contained"
              style={styles.logoutButton}
              labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
              buttonColor="#49A760"
              textColor="#fff"
              onPress={handleLogout}
            >
              Logout
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    ) : (
      <View style={styles.error}>
        <Text style={styles.errorText}>No Profile to show</Text>
        <Text style={styles.errorText}>Do login or sign up before coming here</Text>
      </View>
    )
  );
}

export default profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eafbe7',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    marginTop: 40,
    marginBottom: 40,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#49A760',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#49A760',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1F4E3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F4E3D',
    marginBottom: 18,
    letterSpacing: 1,
  },
  infoSection: {
    width: '100%',
    backgroundColor: '#eafbe7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#49A760',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F4E3D',
  },
  value: {
    fontSize: 18,
    color: '#49A760',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 28,
    width: '70%',
    alignSelf: 'center',
    borderRadius: 18,
    elevation: 2,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'red',
    marginBottom: 10,
  },
});