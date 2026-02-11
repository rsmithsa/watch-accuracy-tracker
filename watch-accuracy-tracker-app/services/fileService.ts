import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';

export async function shareJsonFile(content: string, filename: string): Promise<void> {
  if (Platform.OS === 'web') {
    // Web: Create a blob and trigger download
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Mobile: Write to cache and share
    const file = new File(Paths.cache, filename);
    file.write(content);

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Watch Data',
      UTI: 'public.json',
    });
  }
}

export async function pickAndReadJsonFile(): Promise<string | null> {
  if (Platform.OS === 'web') {
    // Web: Use file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          resolve(null);
        };
        reader.readAsText(file);
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  } else {
    // Mobile: Use DocumentPicker with multiple MIME types.
    // Cloud providers like Dropbox may classify .json files as
    // application/octet-stream or text/plain instead of application/json,
    // so we accept all three to ensure they appear in the picker.
    // copyToCacheDirectory ensures files from cloud providers are
    // downloaded locally before reading.
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'application/octet-stream', 'text/plain'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    const file = new File(asset.uri);
    const content = await file.text();
    return content;
  }
}
