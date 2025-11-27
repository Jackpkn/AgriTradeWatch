import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import profileService, { FarmerProfileData, DTEntry } from "@/services/profile-service";

type FarmerProfileRouteProp = RouteProp<
  { FarmerProfile: { username: string } },
  "FarmerProfile"
>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -42,
    backgroundColor: "#f8fffe",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#9C27B0",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: "#9C27B0",
    marginLeft: 8,
    fontWeight: "600",
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  job: {
    fontSize: 16,
    color: "#666",
    textTransform: "capitalize",
  },
  profileDetails: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailIcon: {
    marginRight: 12,
  },
  detailText: {
    fontSize: 15,
    color: "#333",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  entriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  commodityText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#9C27B0",
    textTransform: "capitalize",
  },
  varietyText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  unitText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  entryDetails: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
  },
  entryDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  entryDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  entryDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  noEntriesContainer: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  noEntriesText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },
});

const FarmerProfile: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<FarmerProfileRouteProp>();
  const { username } = route.params;

  const [profile, setProfile] = useState<FarmerProfileData | null>(null);
  const [entries, setEntries] = useState<DTEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFarmerData();
  }, [username]);

  const fetchFarmerData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch both profile and entries in parallel
      const [profileData, entriesData] = await Promise.all([
        profileService.getFarmerProfile(username),
        profileService.getFarmerEntries(username),
      ]);

      setProfile(profileData);
      setEntries(entriesData);
    } catch (err: any) {
      console.error("Error fetching farmer data:", err);
      setError(err.message || "Failed to load farmer profile");
    } finally {
      setLoading(false);
    }
  };

  const getAvatarColor = (username: string): string[] => {
    const colors = [
      ["#9C27B0", "#7B1FA2"],
      ["#2196F3", "#1976D2"],
      ["#4CAF50", "#388E3C"],
      ["#FF9800", "#F57C00"],
      ["#F44336", "#D32F2F"],
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9C27B0" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
          <Text style={styles.errorText}>{error || "Profile not found"}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFarmerData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const avatarColors = getAvatarColor(profile.username);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={avatarColors}
              style={styles.avatarContainer}
            >
              <Text style={styles.avatarText}>
                {profile.username.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{profile.username}</Text>
              <Text style={styles.job}>{profile.job}</Text>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9C27B0"
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>{profile.email}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#9C27B0"
                style={styles.detailIcon}
              />
              <Text style={styles.detailText}>{profile.mobile}</Text>
            </View>
          </View>
        </View>

        {/* Entries Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={24} color="#9C27B0" />
          <Text style={styles.sectionTitle}>
            Produce Listings ({entries.length})
          </Text>
        </View>

        <View style={styles.entriesContainer}>
          {entries.length === 0 ? (
            <View style={styles.noEntriesContainer}>
              <Ionicons name="leaf-outline" size={64} color="#ccc" />
              <Text style={styles.noEntriesText}>
                No produce listings yet
              </Text>
            </View>
          ) : (
            entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commodityText}>
                      {entry.sale_commodity}
                    </Text>
                    <Text style={styles.varietyText}>{entry.variety_name}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>₹{entry.cost}</Text>
                    <Text style={styles.unitText}>per {entry.unit}</Text>
                  </View>
                </View>

                <View style={styles.entryDetails}>
                  <View style={styles.entryDetailRow}>
                    <Text style={styles.entryDetailLabel}>Quantity:</Text>
                    <Text style={styles.entryDetailValue}>
                      {entry.quantity_for_sale} {entry.unit}
                    </Text>
                  </View>
                  <View style={styles.entryDetailRow}>
                    <Text style={styles.entryDetailLabel}>
                      Level of Produce:
                    </Text>
                    <Text style={styles.entryDetailValue}>
                      {entry.level_of_produce.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <View style={styles.entryDetailRow}>
                    <Text style={styles.entryDetailLabel}>Listed:</Text>
                    <Text style={styles.entryDetailValue}>
                      {formatDate(entry.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FarmerProfile;
