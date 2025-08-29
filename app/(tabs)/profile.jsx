import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { GlobalContext } from "../../context/GlobalProvider";
import { router } from "expo-router";
import { auth } from "../../firebase";
import { getUserData } from "../../components/crud";

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

  const profileFields = [
    { label: "Full Name", value: user?.name, icon: "👤" },
    { label: "Email Address", value: user?.email, icon: "📧" },
    { label: "Username", value: user?.username, icon: "@" },
    { label: "Occupation", value: user?.job, icon: "💼" },
    { label: "Phone Number", value: user?.phoneNumber, icon: "📱" },
  ];

  return user ? (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#f8fffe", "#eafbe7"]}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#49A760", "#3d8b4f"]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {user.name ? user.name[0].toUpperCase() : "?"}
                </Text>
              </LinearGradient>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.job}</Text>
          </View>

          {/* Profile Information Card */}
          <View style={styles.profileCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Profile Information</Text>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldsContainer}>
              {profileFields.map((field, index) => (
                <View key={index} style={styles.fieldRow}>
                  <View style={styles.fieldIcon}>
                    <Text style={styles.iconText}>{field.icon}</Text>
                  </View>
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldValue} numberOfLines={1}>
                      {field.value || "Not provided"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LinearGradient
                colors={["#ff4757", "#ff3742"]}
                style={styles.logoutGradient}
              >
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  ) : (
    <View style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <Text style={styles.errorIcon}>🚫</Text>
        <Text style={styles.errorTitle}>No Profile Found</Text>
        <Text style={styles.errorMessage}>
          Please sign in to view your profile information
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fffe",
  },
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F4E3D",
    marginBottom: 4,
    textAlign: "center",
  },
  userRole: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    textTransform: "capitalize",
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F4E3D",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#49A760",
    borderRadius: 20,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  fieldsContainer: {
    padding: 24,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  fieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f8fffe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: "#1F4E3D",
    fontWeight: "600",
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    gap: 16,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#49A760",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  secondaryButtonText: {
    color: "#49A760",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fffe",
    paddingHorizontal: 20,
  },
  errorCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: "100%",
    maxWidth: 320,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F4E3D",
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: "#49A760",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
