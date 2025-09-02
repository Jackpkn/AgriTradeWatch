import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

// Reusable Form Input Component
export const FormInput = ({ icon, containerStyle, ...props }) => (
  <View style={[styles.inputContainer, containerStyle]}>
    <Icon name={icon} size={20} color="#666" style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholderTextColor="#9A9A9A"
      {...props}
    />
  </View>
);

// Reusable Selection Button Component
export const SelectionButton = ({ label, value, icon, onPress }) => (
  <View style={styles.selectionSection}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <TouchableOpacity style={styles.selectionButton} onPress={onPress}>
      <Text style={styles.selectionIcon}>{icon}</Text>
      <Text style={styles.selectionText}>{value}</Text>
      <Icon name="chevron-down" size={20} color="#666" />
    </TouchableOpacity>
  </View>
);

// Reusable Selection Modal Component
export const SelectionModal = ({ visible, onClose, title, options, selectedValue, onSelect }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.modalItem,
                selectedValue === option.name && styles.selectedModalItem,
              ]}
              onPress={() => {
                onSelect(option.name);
                onClose();
              }}
            >
              <Text style={styles.modalItemIcon}>{option.icon}</Text>
              <View style={styles.modalItemTextContainer}>
                <Text style={[styles.modalItemText, selectedValue === option.name && styles.selectedModalItemText]}>
                  {option.name}
                </Text>
                <Text style={styles.modalItemDescription}>{option.description}</Text>
              </View>
              {selectedValue === option.name && (
                <Icon name="checkmark" size={20} color="#49A760" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// Shared styles for form components
const styles = {
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 8, 
    backgroundColor: '#f9f9f9', 
    marginBottom: 15 
  },
  input: { 
    flex: 1, 
    paddingVertical: 12, 
    paddingHorizontal: 10, 
    fontSize: 16 
  },
  inputIcon: { 
    marginHorizontal: 10 
  },
  selectionSection: { 
    marginBottom: 15 
  },
  sectionLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: "#333", 
    marginBottom: 8 
  },
  selectionButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingVertical: 12, 
    paddingHorizontal: 15, 
    backgroundColor: "#f0f0f0", 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: "#ddd" 
  },
  selectionIcon: { 
    fontSize: 24, 
    marginRight: 12 
  },
  selectionText: { 
    flex: 1, 
    fontSize: 16, 
    color: "#333", 
    fontWeight: '500' 
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: "flex-end", 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },
  modalContent: { 
    backgroundColor: "#fff", 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    width: "100%", 
    maxHeight: "70%", 
    padding: 20 
  },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    width: "100%", 
    paddingBottom: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    textAlign: "center", 
    flex: 1, 
    marginLeft: 24 
  },
  modalList: { 
    width: "100%", 
    marginTop: 10 
  },
  modalItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 12, 
    paddingHorizontal: 5, 
    borderRadius: 8 
  },
  selectedModalItem: { 
    backgroundColor: "#E8F5E9" 
  },
  modalItemIcon: { 
    fontSize: 24, 
    marginRight: 15 
  },
  modalItemTextContainer: { 
    flex: 1 
  },
  modalItemText: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333" 
  },
  selectedModalItemText: { 
    color: "#2E7D32" 
  },
  modalItemDescription: { 
    fontSize: 13, 
    color: "#666", 
    marginTop: 2 
  },
};
