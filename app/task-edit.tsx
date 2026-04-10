import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Clock, Layers, Activity, Check, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize } from '../src/theme';
import { useTasks, useTaskSessionStats } from '../src/store/TaskContext';
import { useSessions } from '../src/store/SessionContext';
import { formatDuration } from '../src/utils';
import TagInput from '../src/components/TagInput';

export default function TaskEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ taskId?: string }>();

  const { getTask, updateTask, deleteTask } = useTasks();
  const { sessions } = useSessions();

  const task = params.taskId ? getTask(params.taskId) : null;
  const stats = useTaskSessionStats(params.taskId || '', sessions);

  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (task) {
      setName(task.name);
      setTags(task.tags);
      setInfo(task.info);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!task) return;
    updateTask({ ...task, name: name.trim(), tags, info: info.trim() });
    router.back();
  }, [task, name, tags, info, updateTask, router]);

  const handleDelete = useCallback(() => {
    if (!task) return;
    Alert.alert(
      'Delete Task',
      'This will also delete all subtasks. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            router.back();
          },
        },
      ]
    );
  }, [task, deleteTask, router]);

  if (!task) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Task Not Found</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Task Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Task name"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.label}>Tags</Text>
          <TagInput tags={tags} onChange={setTags} />
        </View>

        {/* Information */}
        <View style={styles.section}>
          <Text style={styles.label}>Information</Text>
          <TextInput
            style={[styles.textInput, styles.multiline]}
            placeholder="Add notes or details about this task..."
            placeholderTextColor={Colors.textMuted}
            value={info}
            onChangeText={setInfo}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Session stats */}
        <View style={styles.section}>
          <Text style={styles.label}>Sessions</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Clock size={20} color={Colors.primary} />
              <View>
                <Text style={styles.statValue}>
                  {stats.totalTime > 0 ? formatDuration(stats.totalTime) : '—'}
                </Text>
                <Text style={styles.statLabel}>Total Time</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Layers size={20} color={Colors.accentAmber} />
              <View>
                <Text style={styles.statValue}>{stats.sessionCount}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Activity size={20} color={Colors.accentGreen} />
              <View>
                <Text style={styles.statValue}>
                  {stats.averageTime > 0 ? formatDuration(stats.averageTime) : '—'}
                </Text>
                <Text style={styles.statLabel}>Average</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.saveBtn]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Check size={20} color={Colors.white} />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Trash2 size={18} color={Colors.accentRed} />
            <Text style={styles.deleteBtnText}>Delete Task</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontFamily: 'DMSans_700Bold',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: 'DMSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_400Regular',
  },
  multiline: {
    height: 120,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontFamily: 'DMSans_400Regular',
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_700Bold',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accentRed,
  },
  deleteBtnText: {
    color: Colors.accentRed,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_600SemiBold',
  },
});
