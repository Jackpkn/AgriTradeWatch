
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CROP_OPTIONS } from "@/constants/mapConfig";

interface CropSelectionModalProps {
  visible: boolean;
  selectedCrop: string;
  onSelect: (crop: string) => void;
  onClose: () => void;
}

const CropSelectionModal = ({ visible, selectedCrop, onSelect, onClose }: CropSelectionModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Select Crop</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.content}>
            {CROP_OPTIONS.map((crop) => (
              <TouchableOpacity
                key={crop.value}
                style={[
                  modalStyles.cropOption,
                  selectedCrop === crop.value && modalStyles.selectedCropOption,
                ]}
                onPress={() => {
                  onSelect(crop.value);
                  onClose();
                }}
              >
                <Text style={modalStyles.cropIcon}>{crop.icon}</Text>
                <Text
                  style={[
                    modalStyles.cropLabel,
                    selectedCrop === crop.value &&
                    modalStyles.selectedCropLabel,
                  ]}
                >
                  {crop.label}
                </Text>
                {selectedCrop === crop.value && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = {
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%" as const,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#1F4E3D",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  cropOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f8f8f8",
  },
  selectedCropOption: {
    backgroundColor: "#49A760",
  },
  cropIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cropLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1F4E3D",
  },
  selectedCropLabel: {
    color: "#fff",
  },
};

export default CropSelectionModal;
