import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
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
    // Mobile: Use File.pickFileAsync
    const result = await File.pickFileAsync(undefined, 'application/json');

    if (!result) {
      return null;
    }

    // pickFileAsync can return a File or File[] depending on multi-select
    const pickedFile = Array.isArray(result) ? result[0] : result;

    if (!pickedFile) {
      return null;
    }

    const content = await pickedFile.text();
    return content;
  }
}
