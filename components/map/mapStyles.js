import { StyleSheet, Dimensions } from "react-native";
import { MAP_CONFIG } from "../../constants/mapConfig";

const { width } = Dimensions.get("window");

export const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: MAP_CONFIG.COLORS.SECONDARY,
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  cropSelectorContainer: {
    alignItems: "flex-end",
  },
  cropSelectorLabel: {
    fontSize: 12,
    color: MAP_CONFIG.COLORS.SECONDARY,
    marginBottom: 4,
  },
  cropSelectorButton: {
    backgroundColor: MAP_CONFIG.COLORS.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cropSelectorButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mapTypeSelector: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 2,
  },
  mapTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  selectedMapTypeButton: {
    backgroundColor: MAP_CONFIG.COLORS.PRIMARY,
  },
  mapTypeText: {
    fontSize: 14,
    color: MAP_CONFIG.COLORS.SECONDARY,
    fontWeight: "500",
  },
  selectedMapTypeText: {
    color: "#fff",
  },
  contentScroll: {
    flex: 1,
  },
  mapContainer: {
    height: 400,
    backgroundColor: "#e0e0e0",
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  mapLoadingText: {
    fontSize: 16,
    color: MAP_CONFIG.COLORS.SECONDARY,
  },
  sliderSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 1,
    position: "relative",
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: MAP_CONFIG.COLORS.SECONDARY,
    marginBottom: 12,
    textAlign: "center",
  },
  slider: {
    width: "100%",
    height: 40,
    marginBottom: 20,
  },
  sliderThumb: {
    backgroundColor: MAP_CONFIG.COLORS.PRIMARY,
    width: 20,
    height: 20,
  },
  sliderRangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  sliderRangeLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  sliderRangeLabelCenter: {
    textAlign: "center",
  },
  sliderMarkersContainer: {
    position: "relative",
    height: 30,
  },
  sliderCurrentIndicator: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -1 }],
  },
  sliderCurrentIndicatorLine: {
    width: 2,
    height: 15,
    backgroundColor: MAP_CONFIG.COLORS.PRIMARY,
  },
  sliderCurrentIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MAP_CONFIG.COLORS.PRIMARY,
    marginTop: 2,
  },
  sliderMarker: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -1 }],
  },
  sliderMarkerLine: {
    width: 1,
    height: 8,
    backgroundColor: "#ccc",
  },
  sliderMarkerText: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  sliderMinorMarker: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -0.5 }],
  },
  sliderMinorMarkerLine: {
    width: 1,
    height: 4,
    backgroundColor: "#ddd",
  },
  consumerInfoPanel: {
    backgroundColor: "#fff",
    padding: 20,
    marginTop: 1,
  },
  consumerInfoHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fffe",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: MAP_CONFIG.COLORS.PRIMARY,
  },
  cropIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cropIcon: {
    fontSize: 24,
  },
  cropInfoContainer: {
    flex: 1,
  },
  consumerInfoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: MAP_CONFIG.COLORS.SECONDARY,
    marginBottom: 4,
  },
  consumerInfoSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  consumerStatsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  consumerStatCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fffe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
  },
  consumerStatLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: MAP_CONFIG.COLORS.PRIMARY,
    marginRight: 2,
  },
  consumerStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: MAP_CONFIG.COLORS.PRIMARY,
  },
  consumerStatUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 2,
  },
  consumerStatSubtext: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  priceUnitContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 1,
    gap: 8,
  },
  priceUnitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MAP_CONFIG.COLORS.PRIMARY,
    alignItems: "center",
  },
  priceUnitButtonActive: {
    backgroundColor: MAP_CONFIG.COLORS.PRIMARY,
  },
  priceUnitText: {
    fontSize: 14,
    fontWeight: "600",
    color: MAP_CONFIG.COLORS.PRIMARY,
  },
  priceUnitTextActive: {
    color: "#fff",
  },
  mapLegend: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 1,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: MAP_CONFIG.COLORS.SECONDARY,
    marginBottom: 12,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  legendMarkerCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: MAP_CONFIG.COLORS.USER_LOCATION,
    borderWidth: 2,
    borderColor: "#fff",
  },
  legendText: {
    fontSize: 14,
    color: MAP_CONFIG.COLORS.SECONDARY,
  },
  debugSection: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    marginTop: 1,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  chartSection: {
    backgroundColor: "#fff",
    padding: 16,
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: MAP_CONFIG.COLORS.SECONDARY,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  chartScroll: {
    marginHorizontal: -16,
  },
  chartScrollContent: {
    paddingHorizontal: 16,
  },
  chartWrapper: {
    alignItems: "center",
  },
});
