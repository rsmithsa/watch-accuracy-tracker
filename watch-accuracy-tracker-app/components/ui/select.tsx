import { Pressable, StyleSheet, View, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export interface SelectOption {
  label: string;
  value: string;
}

export type SelectProps = {
  label?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
};

export function Select({ label, value, options, onValueChange, placeholder = 'Select...' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'inputBackground');
  const borderColor = useThemeColor({}, 'inputBorder');
  const iconColor = useThemeColor({}, 'icon');

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      <Pressable
        style={[styles.select, { backgroundColor, borderColor }]}
        onPress={() => setIsOpen(true)}
      >
        <ThemedText style={[styles.selectText, !selectedOption && { color: iconColor }]}>
          {selectedOption?.label || placeholder}
        </ThemedText>
        <IconSymbol name="chevron.down" size={20} color={iconColor} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <ThemedView style={styles.modal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.value === value && styles.optionSelected]}
                  onPress={() => {
                    onValueChange(item.value);
                    setIsOpen(false);
                  }}
                >
                  <ThemedText style={[styles.optionText, item.value === value && { fontWeight: '600' }]}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              )}
            />
          </ThemedView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectText: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modal: {
    width: '100%',
    maxHeight: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionSelected: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  optionText: {
    fontSize: 16,
  },
});
