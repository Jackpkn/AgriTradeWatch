import { StyleSheet } from "react-native";
export const signUpStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  container: { padding: 24, backgroundColor: "#fff" },
  illustration: { width: 180, height: 180, resizeMode: "contain", alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", color: '#333', marginBottom: 8 },
  subtitle: { textAlign: "center", color: "grey", fontSize: 16, marginBottom: 16 },
  locationNote: {
    textAlign: "center",
    color: "#49A760",
    fontSize: 14,
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 20
  },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, backgroundColor: '#f9f9f9', marginBottom: 15 },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16 },
  inputIcon: { marginHorizontal: 10 },
  eyeIcon: { padding: 10 },
  submitButton: { backgroundColor: "#2E7D32", paddingVertical: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  submitButtonDisabled: { backgroundColor: "#ccc", opacity: 0.7 },
  submitButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  loginContainer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  loginText: { fontSize: 16, color: "grey" },
  loginLink: { color: "#2E7D32", fontWeight: "bold", fontSize: 16 },
  locationContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 15
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8
  },
  locationLabel: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#333"
  },
  locationStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4
  },
  locationText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#49A760"
  },
  locationCoords: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace"
  },
  retryLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9f5ec",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    alignSelf: "flex-start"
  },
  retryLocationText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#49A760",
    fontWeight: "600"
  },
});