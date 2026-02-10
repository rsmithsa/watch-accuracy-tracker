import { useState } from 'react';
import { StyleSheet, ScrollView, View, Alert, Modal, Pressable } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useThemeColor } from '@/hooks/use-theme-color';
import { exportAllData, importData, ImportMode, ImportResult } from '@/services/importExportService';
import { shareJsonFile, pickAndReadJsonFile } from '@/services/fileService';
import { useWatchStore } from '@/store/watchStore';

export default function SettingsScreen() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingImportContent, setPendingImportContent] = useState<string | null>(null);

  const loadWatches = useWatchStore((state) => state.loadWatches);
  const cardBackground = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const jsonContent = await exportAllData();
      const filename = `watch-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      await shareJsonFile(jsonContent, filename);
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportPress = async () => {
    setIsImporting(true);
    try {
      const content = await pickAndReadJsonFile();
      if (content) {
        setPendingImportContent(content);
        setShowImportModal(true);
      }
    } catch (error) {
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportConfirm = async (mode: ImportMode) => {
    setShowImportModal(false);
    if (!pendingImportContent) return;

    if (mode === 'replace') {
      Alert.alert(
        'Replace All Data?',
        'This will delete all existing watches and measurements before importing. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => performImport(pendingImportContent, mode),
          },
        ]
      );
    } else {
      await performImport(pendingImportContent, mode);
    }
  };

  const performImport = async (content: string, mode: ImportMode) => {
    setIsImporting(true);
    try {
      const result = await importData(content, mode);
      await loadWatches();
      showImportResult(result, mode);
    } catch (error) {
      Alert.alert('Import Failed', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsImporting(false);
      setPendingImportContent(null);
    }
  };

  const showImportResult = (result: ImportResult, mode: ImportMode) => {
    const lines: string[] = [];

    if (result.watchesImported > 0) {
      lines.push(`${result.watchesImported} watch${result.watchesImported !== 1 ? 'es' : ''} imported`);
    }
    if (result.measurementsImported > 0) {
      lines.push(`${result.measurementsImported} measurement${result.measurementsImported !== 1 ? 's' : ''} imported`);
    }
    if (mode === 'merge' && result.watchesSkipped > 0) {
      lines.push(`${result.watchesSkipped} watch${result.watchesSkipped !== 1 ? 'es' : ''} skipped (already exist)`);
    }

    if (lines.length === 0) {
      lines.push('No new data to import');
    }

    Alert.alert('Import Complete', lines.join('\n'));
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <ThemedText type="defaultSemiBold">Data Management</ThemedText>
          <ThemedText style={styles.description}>
            Export your watches and measurements as a JSON backup file, or import data from a previous backup.
          </ThemedText>
          <View style={styles.buttonRow}>
            <Button
              title={isExporting ? 'Exporting...' : 'Export Data'}
              variant="secondary"
              onPress={handleExport}
              disabled={isExporting || isImporting}
              style={styles.dataButton}
            />
            <Button
              title={isImporting ? 'Importing...' : 'Import Data'}
              variant="secondary"
              onPress={handleImportPress}
              disabled={isExporting || isImporting}
              style={styles.dataButton}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="defaultSemiBold">About</ThemedText>
          <ThemedText style={styles.description}>
            Watch Accuracy Tracker helps you monitor the accuracy of your mechanical watches by comparing their time to NTP atomic time.
          </ThemedText>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="defaultSemiBold">How to Use</ThemedText>
          <ThemedText style={styles.description}>
            1. Add a watch with its details{'\n'}
            2. Sync your watch to the displayed reference time{'\n'}
            3. Take measurements periodically by tapping when your watch second hand hits 12{'\n'}
            4. View accuracy stats showing seconds gained/lost per day
          </ThemedText>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="defaultSemiBold">Tips</ThemedText>
          <ThemedText style={styles.description}>
            • Take measurements at consistent times (e.g., morning){'\n'}
            • More measurements over longer periods give more accurate results{'\n'}
            • Reset baseline when you manually adjust your watch time
          </ThemedText>
        </Card>

        <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
      </ScrollView>

      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
              Import Mode
            </ThemedText>
            <ThemedText style={styles.modalDescription}>
              Choose how to handle the imported data:
            </ThemedText>

            <Pressable
              style={[styles.modeOption, { borderColor: textColor + '30' }]}
              onPress={() => handleImportConfirm('merge')}
            >
              <ThemedText type="defaultSemiBold">Merge</ThemedText>
              <ThemedText style={styles.modeDescription}>
                Add new items only. Existing watches and measurements will be kept.
              </ThemedText>
            </Pressable>

            <Pressable
              style={[styles.modeOption, { borderColor: textColor + '30' }]}
              onPress={() => handleImportConfirm('replace')}
            >
              <ThemedText type="defaultSemiBold">Replace</ThemedText>
              <ThemedText style={styles.modeDescription}>
                Delete all existing data and import everything from the file.
              </ThemedText>
            </Pressable>

            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => {
                setShowImportModal(false);
                setPendingImportContent(null);
              }}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  dataButton: {
    flex: 1,
  },
  version: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  modeOption: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modeDescription: {
    marginTop: 4,
    opacity: 0.7,
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 8,
  },
});
