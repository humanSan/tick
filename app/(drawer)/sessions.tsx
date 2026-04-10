import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { Menu, Download, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/theme';
import { useSessions } from '../../src/store/SessionContext';
import { useTasks } from '../../src/store/TaskContext';
import SessionCard from '../../src/components/SessionCard';
import { formatDuration, formatDate, formatTime } from '../../src/utils';

export default function SessionsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { sessions } = useSessions();
  const { getTask } = useTasks();

  const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);

  const handleExport = useCallback(async () => {
    if (sessions.length === 0) {
      Alert.alert('No Sessions', 'There are no sessions to export.');
      return;
    }

    const headers = ['Name', 'Start Time', 'End Time', 'Duration', 'Task', 'Tags'];
    const rows = sessions.map((s) => {
      const taskName = s.taskId ? (getTask(s.taskId)?.name || '') : '';
      return [
        `"${s.name || ''}"`,
        `"${formatDate(s.startTime)} ${formatTime(s.startTime)}"`,
        `"${formatDate(s.endTime)} ${formatTime(s.endTime)}"`,
        `"${formatDuration(s.duration)}"`,
        `"${taskName}"`,
        `"${s.tags.join(', ')}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const fileUri = FileSystem.documentDirectory + 'tick_sessions.csv';

    try {
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Sessions',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Export', 'Sharing is not available on this device.');
      }
    } catch (e) {
      console.error('Export error:', e);
      Alert.alert('Error', 'Failed to export sessions.');
    }
  }, [sessions, getTask]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Menu size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Sessions</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={handleExport}>
          <Download size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedSessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: insets.bottom + Spacing.lg }}
        renderItem={({ item }) => (
          <SessionCard
            session={item}
            onPress={() =>
              router.push({
                pathname: '/session-edit',
                params: { sessionId: item.id, isNew: 'false' },
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Clock size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptySubtitle}>Start the stopwatch to record your first session</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontFamily: 'DMSans_700Bold',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontFamily: 'DMSans_600SemiBold',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },
});
