

import React, { useContext } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { GlobalContext } from '../context/GlobalProvider';

const GlobalLoader = () => {
  const { isLoading } = useContext(GlobalContext);
  if (!isLoading) return null;

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color="#49A760" style={{ marginBottom: 18 }} />
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34, 139, 34, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#49A760',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 220,
  },
  text: {
    fontSize: 18,
    color: '#1F4E3D',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 18,
  },
  // ...existing code...
});

export default GlobalLoader;
