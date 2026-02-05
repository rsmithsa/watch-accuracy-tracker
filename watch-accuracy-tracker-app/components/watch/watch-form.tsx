import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MovementType } from '@/types/database';

export type WatchFormData = {
  name: string;
  brand: string;
  model: string;
  movementType: MovementType;
};

export type WatchFormProps = {
  initialData?: Partial<WatchFormData>;
  onSubmit: (data: WatchFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
};

const MOVEMENT_OPTIONS = [
  { label: 'Automatic', value: 'automatic' },
  { label: 'Manual Wind', value: 'manual' },
  { label: 'Quartz', value: 'quartz' },
];

export function WatchForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Save',
}: WatchFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [movementType, setMovementType] = useState<MovementType>(initialData?.movementType || 'automatic');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      movementType,
    });
  };

  return (
    <View style={styles.container}>
      <Input
        label="Name *"
        value={name}
        onChangeText={setName}
        placeholder="e.g., Daily Seiko"
        error={errors.name}
        autoFocus
      />

      <Input
        label="Brand"
        value={brand}
        onChangeText={setBrand}
        placeholder="e.g., Seiko, Rolex, Omega"
      />

      <Input
        label="Model"
        value={model}
        onChangeText={setModel}
        placeholder="e.g., SKX007, Submariner"
      />

      <Select
        label="Movement Type"
        value={movementType}
        options={MOVEMENT_OPTIONS}
        onValueChange={(value) => setMovementType(value as MovementType)}
      />

      <View style={styles.buttons}>
        {onCancel && (
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            style={styles.cancelButton}
          />
        )}
        <Button
          title={submitLabel}
          onPress={handleSubmit}
          disabled={isLoading}
          style={styles.submitButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
