

import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useGlobal } from "@/context/global-provider";
import { useTranslation } from "@/hooks/useTranslation";

interface LoaderProps {
  message?: string;
  visible?: boolean;
}

const GlobalLoader = ({ message, visible }: LoaderProps = {}) => {
  // Get contexts - these must be called unconditionally at the top level
  const contextValue = useGlobal();
  const { t, isLoading: translationLoading } = useTranslation();

  const { isLoading = false } = contextValue || {};
  const shouldShow = visible !== undefined ? visible : isLoading;

  // Don't show loader if translations are still loading to avoid errors
  if (translationLoading || !shouldShow) return null;

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loaderBox}>
        <ActivityIndicator size="large" color="#49A760" style={{ marginBottom: 16 }} />
        <Text style={styles.text}>
          {message || t.common.pleaseWait}
        </Text>
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
    fontSize: 16,
    color: '#1F4E3D',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default GlobalLoader;
