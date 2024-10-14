import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from 'react-native-paper'
import { router } from 'expo-router'

const Home = () => {
  return (
   <SafeAreaView>
    <ScrollView contentContainerStyle={{ height: "100%", width:"100%" }} >
      <View style={{
        width: "100vw",
        height: "10%",
        backgroundColor: "red",
      }} >
        <Text>Top App Bar</Text>
        <Text>Top App Bar</Text>
      </View>
      <View style={{
        width: "100vw",
        height: "10%",
        backgroundColor: "blue",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }} >
          <Button  mode="contained" onPress={() => router.replace("/crops")}>
    Add a crop
  </Button>
      </View>  
    </ScrollView>
   </SafeAreaView>
  )
}

export default Home
