import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  TextInputProps,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import Ionicons from "@expo/vector-icons/Ionicons";

// Type definitions
export interface SelectionOption {
  id: string | number;
  name: string;
  icon: string;
  description?: string;
}

export interface FormInputProps extends Omit<TextInputProps, 'style'> {
  icon: string;
  containerStyle?: ViewStyle;
  error?: string;
}

export interface SelectionButtonProps {
  label: string;
  value: string;
  icon: string;
  onPress: () => void;
  error?: string;
}

export interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SelectionOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

// Enhanced Form Input Component with error handling
export const FormInput: React.FC<FormInputProps> = ({
  icon,
  containerStyle,
  error,
  ...props
}) => (
  <View style={[styles.inputSection, containerStyle]}>
    <View style={[
      styles.inputContainer,
      error && styles.inputContainerError
    ]}>
      <Ionicons name={icon as any} size={20} color={error ? '#FF6B6B' : '#666'} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholderTextColor="#9A9A9A"
        {...props}
      />
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Enhanced Selection Button Component with error handling
export const SelectionButton: React.FC<SelectionButtonProps> = ({
  label,
  value,
  icon,
  onPress,
  error
}) => (
  <View style={styles.selectionSection}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <TouchableOpacity
      style={[
        styles.selectionButton,
        error && styles.selectionButtonError
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.selectionIcon}>{icon}</Text>
      <Text style={[
        styles.selectionText,
        !value && styles.placeholderText
      ]}>
        {value || `Select ${label.toLowerCase()}`}
      </Text>
      <Ionicons name="chevron-down" size={20} color={error ? '#FF6B6B' : '#666'} />
    </TouchableOpacity>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Enhanced Selection Modal Component with better UX
export const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
    statusBarTranslucent
  >
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalIndicator} />

        <ScrollView
          style={styles.modalList}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {options.map((option) => {
            const isSelected = selectedValue === option.name;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.modalItem,
                  isSelected && styles.selectedModalItem,
                ]}
                onPress={() => {
                  onSelect(option.name);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalItemIcon}>{option.icon}</Text>
                <View style={styles.modalItemTextContainer}>
                  <Text style={[
                    styles.modalItemText,
                    isSelected && styles.selectedModalItemText
                  ]}>
                    {option.name}
                  </Text>
                  {option.description && (
                    <Text style={styles.modalItemDescription}>
                      {option.description}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// Enhanced StyleSheet with better organization and theming
const styles = StyleSheet.create({
  // Input Components
  inputSection: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    minHeight: 48,
    paddingHorizontal: 4,
  },
  inputContainerError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Selection Components
  selectionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 48,
  },
  selectionButtonError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  selectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9A9A9A',
    fontWeight: '400',
  },

  // Modal Components
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
  },
  modalList: {
    marginTop: 8,
    flexGrow: 0,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginVertical: 2,
  },
  selectedModalItem: {
    backgroundColor: '#E8F5E9',
  },
  modalItemIcon: {
    fontSize: 28,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  modalItemTextContainer: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 0.2,
  },
  selectedModalItemText: {
    color: '#2E7D32',
  },
  modalItemDescription: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
    lineHeight: 16,
  },
});

