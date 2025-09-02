import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRealtimeCrops, useRealtimePrices } from "@/hooks/useRealtimeData";

const RealtimeDataExample = ({ cropPath, cropId, location }) => {
  const {
    data: cropsData,
    loading: cropsLoading,
    error: cropsError,
    isFromCache: cropsFromCache,
    isStale: cropsStale,
    isOnline,
    refresh: refreshCrops,
  } = useRealtimeCrops(cropPath);

  const {
    data: pricesData,
    loading: pricesLoading,
    error: pricesError,
    isFromCache: pricesFromCache,
    isStale: pricesStale,
    refresh: refreshPrices,
  } = useRealtimePrices(cropId, location);

  const getDataStatus = (fromCache, stale, online) => {
    if (!online) return "🔴 Offline";
    if (stale) return "🟡 Stale Data";
    if (fromCache) return "🟠 Cached";
    return "🟢 Live";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Real-time Data Status</Text>

      {/* Network Status */}
      <View style={styles.statusRow}>
        <Text style={styles.label}>Network:</Text>
        <Text style={[styles.status, { color: isOnline ? "green" : "red" }]}>
          {isOnline ? "🟢 Online" : "🔴 Offline"}
        </Text>
      </View>

      {/* Crops Data Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crops Data</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.status}>
            {getDataStatus(cropsFromCache, cropsStale, isOnline)}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Count:</Text>
          <Text style={styles.value}>{cropsData?.length || 0}</Text>
        </View>
        {cropsLoading && <Text style={styles.loading}>Loading...</Text>}
        {cropsError && (
          <Text style={styles.error}>Error: {cropsError.message}</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={refreshCrops}>
          <Text style={styles.buttonText}>Refresh Crops</Text>
        </TouchableOpacity>
      </View>

      {/* Prices Data Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prices Data</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.status}>
            {getDataStatus(pricesFromCache, pricesStale, isOnline)}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Count:</Text>
          <Text style={styles.value}>{pricesData?.length || 0}</Text>
        </View>
        {pricesLoading && <Text style={styles.loading}>Loading...</Text>}
        {pricesError && (
          <Text style={styles.error}>Error: {pricesError.message}</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={refreshPrices}>
          <Text style={styles.buttonText}>Refresh Prices</Text>
        </TouchableOpacity>
      </View>

      {/* Cache Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cache Info</Text>
        <Text style={styles.info}>
          • Real-time listeners active when online{"\n"}• Background sync every
          30s when offline{"\n"}• Stale data refreshed automatically{"\n"}•
          Fallback to cache when network fails
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  status: {
    fontSize: 14,
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  loading: {
    fontSize: 12,
    color: "#007AFF",
    fontStyle: "italic",
  },
  error: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  info: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
});

export default RealtimeDataExample;
