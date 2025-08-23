import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity,PermissionsAndroid, Image, ScrollView  , Platform, Alert} from 'react-native';
// import Geolocation from 'react-native-geolocation-service';
import { getLocation } from '../../components/getLocation';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlobalContext } from '../../context/GlobalProvider';
import {  Link, router } from 'expo-router';
import {auth} from '../../firebase';
import { getUserData } from '../../components/crud';
import { Button } from "react-native-paper";

// Main App Component
const home = () => {

  
  const { setCurrentLocation, setMainUser  } = useContext(GlobalContext);

  const [location, setLocation] = useState(null)

  const fetchLocation = React.useCallback(() => {
    getLocation(
      (location) => {
        setLocation(location);
        setCurrentLocation(location);
      },
      (error) => {
        console.error(error);
      },
      setCurrentLocation
    );
  }, [setCurrentLocation]);

  const getUser = React.useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userData = await getUserData(user.uid);
        setMainUser(userData);
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }, [setMainUser]);

  useEffect(() => {
    fetchLocation();
    getUser();
  }, [fetchLocation, getUser]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#eafbe7' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 32 }}>
        <View style={{ width: '97%', backgroundColor: '#fff', borderRadius: 24, padding: 18, shadowColor: '#49A760', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6, marginTop: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1F4E3D', marginBottom: 12, letterSpacing: 1, textAlign: 'center' }}>Welcome to MandiGo</Text>
          <Text style={{ fontSize: 16, color: '#49A760', marginBottom: 18, textAlign: 'center' }}>Your one-stop platform for crop price tracking</Text>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333333', marginBottom: 10, textAlign: 'center' }}>Main Features</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ backgroundColor: '#eafbe7', width: '48%', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16, elevation: 2 }}>
              <Ionicons name="add-circle" size={32} color="#49A760" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F4E3D', marginTop: 8 }}>Add Crop</Text>
              <Text style={{ fontSize: 13, color: '#49A760', textAlign: 'center', marginVertical: 4 }}>Submit new crop prices and details</Text>
              <Button mode="contained" style={{ backgroundColor: '#49A760', marginTop: 8, borderRadius: 8 }} textColor="#fff" onPress={() => router.push("crops")}>Go</Button>
            </View>
            <View style={{ backgroundColor: '#eafbe7', width: '48%', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16, elevation: 2 }}>
              <Ionicons name="stats-chart" size={32} color="#49A760" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F4E3D', marginTop: 8 }}>View Stats</Text>
              <Text style={{ fontSize: 13, color: '#49A760', textAlign: 'center', marginVertical: 4 }}>Analyze crop price trends</Text>
              <Button mode="contained" style={{ backgroundColor: '#49A760', marginTop: 8, borderRadius: 8 }} textColor="#fff" onPress={() => router.push("stats")}>Go</Button>
            </View>
            <View style={{ backgroundColor: '#eafbe7', width: '48%', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 16, elevation: 2 }}>
              <Ionicons name="person-circle" size={32} color="#49A760" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F4E3D', marginTop: 8 }}>Profile</Text>
              <Text style={{ fontSize: 13, color: '#49A760', textAlign: 'center', marginVertical: 4 }}>View and edit your profile</Text>
              <Button mode="contained" style={{ backgroundColor: '#49A760', marginTop: 8, borderRadius: 8 }} textColor="#fff" onPress={() => router.push("profile")}>Go</Button>
            </View>
            {/* Add more feature cards here as needed */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  weatherContainer: {
    backgroundColor: '#d1f7d6',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
  },
  temperature: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#333333',
  },
  city: {
    fontSize: 18,
    color: '#333333',
    marginTop: 10,
  },
  weatherCondition: {
    fontSize: 16,
    color: '#666666',
  },
  weatherIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  addCropButton: {
    backgroundColor: '#34c759',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  addCropText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureBox: {
    backgroundColor: '#e8f5e9',
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    marginTop: 10,
  },
  featureButton: {
    marginTop: 10,
    color: '#34c759',
    fontWeight: 'bold',
  },
});

export default home;
