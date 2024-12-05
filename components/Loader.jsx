import React, { useContext } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
// import second from 'first'; 
import { GlobalContext } from '../context/GlobalProvider';

const GlobalLoader = () => {
  const { isLoading } =
    useContext(GlobalContext);

  if (!isLoading) return null;

  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default GlobalLoader;
