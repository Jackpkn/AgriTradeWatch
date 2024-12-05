import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button } from 'react-native-paper';
import api from '../../components/GlobalApi';
import Boxplot from '../../components/Boxplot';

const stats = () => {

    const [data, setData] = useState([]);


    // useEffect(() => {
        const fetchData = async () => {
        try {
          
            const res = await api.get("/consumers");
  
            // console.log("consumer data: ", res.data);
            setData(res.data.data);
          } catch (err) {
            console.error("Error:", err.response.data);
          }
        };

  
        useEffect(() => {
            fetchData();
        }, []);

        const prices = data.map(entry => entry.price);
        console.log("Prices: ", prices);
        
  return (
    
    <SafeAreaView>
      <ScrollView contentContainerStyle={{ width: "100%" }} >
        <View style={styles.container}>
            <View style={styles.header}>
            <Text style={styles.headerText}>Stats</Text>
            </View>
            <View style={styles.profileSection}>
            <Text style={styles.label}>Total Consumers:</Text>
            <Text style={styles.value}>{data.length}</Text>
            </View>
            <View style={styles.profileSection}>
            <Text style={styles.label}>Total Farmers:</Text>
            <Text style={styles.value}> {data.length} </Text>
            </View>
            <View style={styles.profileSection}>
            <Text style={styles.label}>Total Crops:</Text>
            <Text style={styles.value}>{data.length}</Text>
            </View>
        </View>
    
    <View style={styles.buttonContainer}>
    <Button
            mode="contained"
            style={{
              position: "absolute",
              bottom: 20,
              alignSelf: "center",
              backgroundColor: "#1F4E3D",
            }}
            textColor="white"
            onPress={fetchData}
          > Fetch Data
            </Button>
    </View>

    {/* <Boxplot data={prices} width={300} height={100} margin={10} /> */}

      </ScrollView>

    </SafeAreaView>
    
  )
}

export default stats

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
    },
    header: {
      backgroundColor: '#1F4E3D',
      width: '100%',
      padding: 10,
      alignItems: 'center',
    },
    headerText: {
      color: 'white',
      fontSize: 20,
    },
    profileSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 10,
      width: '100%',
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
    },
    label: {
      fontSize: 16,
      color: '#333',
    },
    value: {
      fontSize: 16,
      color: '#666',
    },
    buttonContainer: {
      padding: 10,
      width: '100%',
    //   height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 100,
    //   position: 'absolute',
    //     top: 200,
    //     right: 10,
    },
  });
