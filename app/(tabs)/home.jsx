import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity,PermissionsAndroid, Image, ScrollView  , Platform, Alert} from 'react-native';
// import Geolocation from 'react-native-geolocation-service';
import * as Location from 'expo-location';  
import { Ionicons } from '@expo/vector-icons'; // For icons
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlobalContext } from '../../context/GlobalProvider';
import {  Link, router } from 'expo-router';
import {auth} from '../../firebase';
import { getUserData } from '../../components/crud';

// Main App Component
const home = () => {

  
  const { setCurrentLocation, setMainUser  } = useContext(GlobalContext);

  const [location, setLocation] = useState(null)

  useEffect(() => {
    const getLocation = async () => {
      try{
        let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});

      console.log( "location :" , location);
      setLocation(location);
      setCurrentLocation(location);
      } catch (error) {
        console.error(error);
      }
    }
getLocation();

const getUser = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      // console.log('User:', user);
      const userData = await getUserData(user.uid);
      console.log('User Data:', userData);
      setMainUser(userData);
    } else {
      console.log('No user found');
    }
  } catch (error) {
    console.error('Error getting user:', error);

  }
}

getUser();

  }
  , []);

  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ width: "100%" }} >
      <View style={styles.container}>
      {/* Header with Weather Info */}

      {/* Add Crop Button */}
       <TouchableOpacity onPress={()=> router.push("crops") } style={styles.addCropButton} >
        <Text style={styles.addCropText}>  Add Crop  </Text>
        <Ionicons name="arrow-forward-circle" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Main Features Section */}
      <Text style={styles.sectionTitle}>Main Features</Text>
      <View style={styles.featuresContainer}>
        {/* Diagnose Diseases Feature */}
        <TouchableOpacity style={styles.featureBox} >
          <Ionicons name="medical" size={40} color="#34c759" />
          <Text style={styles.featureTitle}>Diagnose your crop</Text>
          <Text style={styles.featureButton}>Diagnose Diseases</Text>
        </TouchableOpacity>

        {/* Soil Status Feature */}
        <TouchableOpacity style={styles.featureBox}>
          <Ionicons name="leaf" size={40} color="#34c759" />
          <Text style={styles.featureTitle}>Follow your soil status</Text>
          <Text style={styles.featureButton}>Soil Status</Text>
        </TouchableOpacity>
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
