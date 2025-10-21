
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Image, ScrollView, Text, View, TouchableOpacity, Linking, Alert, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

// Local assets, styles, and context
import logo from "@/assets/images/logo1.png";
import { indexStyles as styles } from "@/components/IndexCss";
import { useGlobal } from "@/context/global-provider";
import { useTranslation } from "@/hooks/useTranslation";
import { LANGUAGES } from "@/constants/authConstants";

// ========================================================================
// SplashScreen Component
// ========================================================================

const SplashScreen = () => {
  const { t } = useTranslation();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#eafbe7",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <StatusBar style="dark" />
      <View style={{ alignItems: "center" }}>
        <Image source={logo} style={{ width: 120, height: 120, marginBottom: 20 }} resizeMode="contain" />
        <Text style={{ fontSize: 24, color: "#49A760", marginBottom: 8, fontWeight: "bold" }}>
          {t.branding.appName}
        </Text>
        <Text style={{ fontSize: 16, color: "#666", marginBottom: 20 }}>
          {t.home.checkingAuth}
        </Text>
        <ActivityIndicator size="large" color="#49A760" />
      </View>
    </SafeAreaView>
  );
};

// ========================================================================
// Main Index Component
// ========================================================================

export default function Index() {
  const navigation = useNavigation();
  const { isOnline, isLogged, isLoading } = useGlobal();
  const { t, language, setLanguage } = useTranslation();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [, forceUpdate] = useState({});

  // Debug: Log current language whenever it changes
  useEffect(() => {
    console.log('📱 Current language in Index:', language);
    console.log('📚 Current translations sample:', t.common.loading);
    console.log('📝 App name should be:', t.branding.appName);
    // Force a re-render when language changes
    forceUpdate({});
  }, [language]);

  const handleAboutUsPress = useCallback(async () => {
    const url = "https://mandigo.in/page/aboutus/";
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", `Cannot open the URL: ${url}`);
    }
  }, []);

  // --- Effects ---

  // Effect to handle navigation after loading is complete.
  useEffect(() => {
    console.log('🧭 Navigation check:', { isLoading, isLogged });
    // If loading is finished and the user is logged in, navigate to the main app.
    if (!isLoading && isLogged) {
      console.log('🧭 Navigating to home...');
      navigation.navigate('Main' as never);
    }
  }, [isLoading, isLogged, navigation]);

  // ======================
  // RENDER LOGIC
  // ======================

  // 1. Initial Loading State (Splash Screen) 
  if (isLoading) {
    return <SplashScreen />;
  }

  // 2. Offline State
  // If not loading and the device is offline, show a connection error.
  if (!isOnline) {
    return (
      <SafeAreaView style={styles.statusContainer}>
        <View style={styles.statusBox}>
          <Text style={styles.statusIcon}>📶</Text>
          <Text style={styles.statusTitle}>{t.network.noInternetConnection}</Text>
          <Text style={styles.statusMessage}>
            {t.network.checkNetworkSettings}
          </Text>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => navigation.navigate('Index' as never)} // A simple replace re-triggers the logic
          >
            <Text style={styles.statusButtonText}>{t.common.tryAgain}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentLanguage = LANGUAGES.find((lang) => lang.code === language);

  console.log('🔄 Rendering Index component with language:', language);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eafbe7" }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} key={`scroll-${language}`}>
        <View style={styles.container} key={`container-${language}`}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.appName} key={`appName-${language}`}>{t.branding.appName}</Text>
            <Text style={styles.tagline} key={`tagline-${language}`}>{t.branding.tagline}</Text>
          </View>

          {/* Language Selection */}
          <View style={styles.languageSection}>
            <Text style={styles.sectionTitle} key={`chooseLanguage-${language}`}>{t.home.chooseLanguage}</Text>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setShowLanguageModal(true)}
            >
              <Text style={styles.languageFlag}>{currentLanguage?.flag}</Text>
              <Text style={styles.languageText}>{currentLanguage?.name}</Text>
              <Ionicons name="chevron-down" size={20} color="#49A760" />
            </TouchableOpacity>
          </View>

          {/* Auth Options */}
          <View style={styles.optionsSection}>
            <TouchableOpacity
              style={[styles.optionButton, styles.loginButton]}
              onPress={() => navigation.navigate('Login' as never)}
            >
              <Ionicons name="log-in-outline" size={24} color="#fff" />
              <Text style={styles.optionButtonText} key={`login-${language}`}>{t.auth.login}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.registerButton]}
              onPress={() => navigation.navigate('Signup' as never)}
            >
              <Ionicons name="person-add-outline" size={24} color="#fff" />
              <Text style={styles.optionButtonText} key={`register-${language}`}>{t.nav.register}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Links */}
          <View style={styles.quickLinksSection}>
            <TouchableOpacity style={styles.quickLinkButton} onPress={handleAboutUsPress}>
              <Ionicons name="information-circle-outline" size={22} color="#49A760" />
              <Text style={styles.quickLinkText} key={`aboutUs-${language}`}>{t.nav.aboutUs}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t.branding.copyright.replace('{{year}}', new Date().getFullYear().toString())}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View
            style={styles.modalContainer}
          >
            <Text style={styles.modalTitle} key={`modalTitle-${language}`}>{t.home.chooseLanguage}</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.modalLanguageOption,
                  language === lang.code && styles.modalLanguageOptionActive,
                ]}
                onPress={async () => {
                  console.log('🔘 Language option pressed:', lang.code);
                  console.log('🔘 setLanguage function:', setLanguage);
                  console.log('🔘 Current language before change:', language);
                  try {
                    await setLanguage(lang.code);
                    console.log('✅ setLanguage call completed');
                    console.log('🔘 Current language after change:', language);
                    setShowLanguageModal(false);
                  } catch (error) {
                    console.error('❌ Error changing language:', error);
                  }
                }}
              >
                <Text style={styles.modalLanguageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.modalLanguageText,
                  language === lang.code && styles.modalLanguageTextActive,
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color="#49A760" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCloseButtonText} key={`close-${language}`}>{t.common.close}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
