import React, { useEffect, useRef } from 'react';
import {
  Platform,
  Modal as RNModal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle
} from 'react-native';
import { theme } from '../theme';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'none' | 'slide' | 'fade';
  dismissOnBackdrop?: boolean;
  style?: ViewStyle;
}

type FocusableElement = {
  blur?: () => void;
};

const getActiveElement = (): FocusableElement | null => {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const globalWithDocument = globalThis as { document?: { activeElement?: unknown } };
  const activeElement = globalWithDocument.document?.activeElement as FocusableElement | undefined;

  return activeElement ?? null;
};

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  children,
  animationType = 'fade',
  dismissOnBackdrop = true,
  style
}) => {
  const wasVisibleRef = useRef(visible);

  useEffect(() => {
    if (Platform.OS === 'web' && wasVisibleRef.current && !visible) {
      const activeElement = getActiveElement();

      if (activeElement?.blur) {
        activeElement.blur();
      }
    }

    wasVisibleRef.current = visible;
  }, [visible]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissOnBackdrop ? onClose : undefined}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.modal, style]}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.large
  }
});