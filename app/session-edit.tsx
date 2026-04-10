import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Check, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Spacing, BorderRadius, FontSize } from '../src/theme';
import { useSessions } from '../src/store/SessionContext';
import { formatDuration, formatDate, formatTime } from '../src/utils';
import TagInput from '../src/components/TagInput';
import TaskSelector from '../src/components/TaskSelector';

export default function SessionEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    sessionId?: string;
    isNew?: string;
    startTime?: string;
    endTime?: string;
    duration?: string;
  }>();

  const { sessions, addSession, updateSession, deleteSession, getSession } = useSessions();

  const isNew = params.isNew === 'true';
  const existingSession = params.sessionId ? getSession(params.sessionId) : null;

  const [name, setName] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(Date.now());
  const [duration, setDuration] = useState(0);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [durationText, setDurationText] = useState('');

  useEffect(() => {
    if (existingSession) {
      setName(existingSession.name);
      setTaskId(existingSession.taskId);
      setTags(existingSession.tags);
      setStartTime(existingSession.startTime);
      setEndTime(existingSession.endTime);
      setDuration(existingSession.duration);
    } else if (isNew) {
      const st = parseInt(params.startTime || '0', 10);
      const et = parseInt(params.endTime || '0', 10);
      const dur = parseInt(params.duration || '0', 10);
      setStartTime(st);
      setEndTime(et);
      setDuration(dur);
    }
  }, []);

  useEffect(() => {
    setDurationText(formatDuration(duration));
  }, [duration]);

  const handleStartChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(false);
    if (date) {
      const newStart = date.getTime();
      setStartTime(newStart);
      const newDur = endTime - newStart;
      setDuration(Math.max(0, newDur));
    }
  }, [endTime]);

  const handleEndChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(false);
    if (date) {
      const newEnd = date.getTime();
      setEndTime(newEnd);
      const newDur = newEnd - startTime;
      setDuration(Math.max(0, newDur));
    }
  }, [startTime]);

  const parseDuration = useCallback((text: string): number | null => {
    const parts = text.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const s = parseInt(parts[2], 10);
      if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
        return (h * 3600 + m * 60 + s) * 1000;
      }
    }
    return null;
  }, []);

  const handleDurationBlur = useCallback(() => {
    const parsed = parseDuration(durationText);
    if (parsed !== null) {
      setDuration(parsed);
      setEndTime(startTime + parsed);
    } else {
      setDurationText(formatDuration(duration));
    }
  }, [durationText, startTime, duration, parseDuration]);

  const handleSave = useCallback(() => {
    const sessionData = {
      name: name.trim(),
      taskId,
      tags,
      startTime,
      endTime,
      duration,
    };
    if (existingSession) {
      updateSession({ ...existingSession, ...sessionData });
    } else {
      addSession(sessionData);
    }
    router.back();
  }, [name, taskId, tags, startTime, endTime, duration, existingSession, addSession, updateSession, router]);

  const handleDiscard = useCallback(() => {
    if (existingSession) {
      Alert.alert('Delete Session', 'Are you sure you want to delete this session?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSession(existingSession.id);
            router.back();
          },
        },
      ]);
    } else {
      router.back();
    }
  }, [existingSession, deleteSession, router]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingSession ? 'Edit Session' : 'Save Session'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Duration highlight */}
        <View style={styles.durationHighlight}>
          <Text style={styles.durationLabel}>Duration</Text>
          <TextInput
            style={styles.durationValue}
            value={durationText}
            onChangeText={setDurationText}
            onBlur={handleDurationBlur}
            keyboardType="numbers-and-punctuation"
            returnKeyType="done"
          />
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Session Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="What were you working on?"
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Task Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Task</Text>
          <TaskSelector selectedTaskId={taskId} onSelect={setTaskId} />
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.label}>Tags</Text>
          <TagInput tags={tags} onChange={setTags} />
        </View>

        {/* Time fields */}
        <View style={styles.section}>
          <Text style={styles.label}>Time</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity style={styles.timeField} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.timeFieldLabel}>Start</Text>
              <Text style={styles.timeFieldValue}>
                {formatDate(startTime)} {formatTime(startTime)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeField} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.timeFieldLabel}>End</Text>
              <Text style={styles.timeFieldValue}>
                {formatDate(endTime)} {formatTime(endTime)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={new Date(startTime)}
            mode="datetime"
            display="spinner"
            onChange={handleStartChange}
            themeVariant="dark"
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={new Date(endTime)}
            mode="datetime"
            display="spinner"
            onChange={handleEndChange}
            themeVariant="dark"
          />
        )}

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
            style={[styles.actionBtn, styles.discardBtn]}
            onPress={handleDiscard}
            activeOpacity={0.8}
          >
            <Trash2 size={18} color={Colors.accentRed} />
            <Text style={styles.discardBtnText}>
              {existingSession ? 'Delete' : 'Discard'}
            </Text>
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
  },
  durationHighlight: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  durationLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: 'DMSans_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  durationValue: {
    color: Colors.primary,
    fontSize: 40,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    minWidth: 200,
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
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timeField: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  timeFieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontFamily: 'DMSans_500Medium',
    marginBottom: 4,
  },
  timeFieldValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
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
  discardBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accentRed,
  },
  discardBtnText: {
    color: Colors.accentRed,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_600SemiBold',
  },
});
