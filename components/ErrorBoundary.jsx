import React, { Component } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error);
    console.error("Error Info:", errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Report to Sentry if available
    if (typeof Sentry !== "undefined") {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = `
Error: ${error?.message || "Unknown error"}
Stack: ${error?.stack || "No stack trace"}
Component Stack: ${errorInfo?.componentStack || "No component stack"}
    `.trim();

    Alert.alert(
      "Report Error",
      "Would you like to report this error to help us improve the app?",
      [
        {
          text: "Report",
          onPress: () => {
            // In a real app, you would send this to your error reporting service
            console.log("Error report:", errorDetails);
            Alert.alert("Thank you", "Error report sent successfully!");
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;

      // Check for specific error types
      const isAuthError = error?.message?.includes("permission-denied") ||
                         error?.message?.includes("auth") ||
                         error?.code?.includes("auth");

      const isNetworkError = error?.message?.includes("network") ||
                            error?.message?.includes("timeout") ||
                            error?.code === "unavailable";

      const isContextError = error?.message?.includes("iterator method is not callable") ||
                            error?.message?.includes("context");

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={isAuthError ? "lock-closed" : isNetworkError ? "cloud-offline" : "alert-circle"}
                size={60}
                color="#ff6b6b"
              />
            </View>

            <Text style={styles.title}>
              {isAuthError ? "Authentication Error" :
               isNetworkError ? "Network Error" :
               isContextError ? "App Error" : "Something went wrong"}
            </Text>

            <Text style={styles.message}>
              {isAuthError
                ? "There was an issue with your login. Please try logging in again."
                : isNetworkError
                ? "Please check your internet connection and try again."
                : isContextError
                ? "The app encountered an internal error. Please restart the app."
                : "An unexpected error occurred. Please try again or contact support if the problem persists."}
            </Text>

            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {error?.message || "Unknown error"}
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.reportButton]}
                onPress={this.handleReportError}
                activeOpacity={0.8}
              >
                <Ionicons name="bug" size={20} color="#666" />
                <Text style={styles.reportButtonText}>Report Error</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fffe",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F4E3D",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  debugContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    width: "100%",
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  retryButton: {
    backgroundColor: "#49A760",
  },
  reportButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  reportButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ErrorBoundary;