import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { CROP_OPTIONS } from "@/constants/mapConfig";
import { mapStyles } from "./mapStyles";

const CropSelectionModal = ({ visible, selectedCrop, onSelect, onClose }) => {
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
              <Icon name="close" size={24} color="#666" />
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
                  <Icon name="checkmark" size={20} color="#fff" />
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
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F4E3D",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  cropOption: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    color: "#1F4E3D",
  },
  selectedCropLabel: {
    color: "#fff",
  },
};

export default CropSelectionModal;
