import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Folder, XCircle, ChevronRight, X, Search, CheckCircle } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import { useTasks } from '../store/TaskContext';
import { Task } from '../types';

interface TaskSelectorProps {
  selectedTaskId: string | null;
  onSelect: (taskId: string | null) => void;
}

export default function TaskSelector({ selectedTaskId, onSelect }: TaskSelectorProps) {
  const { tasks, getTaskPath } = useTasks();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  const filteredTasks = search.trim()
    ? tasks.filter((t) => {
        const path = getTaskPath(t.id).toLowerCase();
        return path.includes(search.toLowerCase());
      })
    : tasks;

  const handleSelect = (task: Task) => {
    onSelect(task.id);
    setVisible(false);
    setSearch('');
  };

  const handleClear = () => {
    onSelect(null);
  };

  return (
    <View>
      <TouchableOpacity style={styles.selector} onPress={() => setVisible(true)}>
        <Folder size={18} color={Colors.textSecondary} />
        <Text
          style={[
            styles.selectorText,
            !selectedTask && { color: Colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {selectedTask ? getTaskPath(selectedTask.id) : 'Select a task...'}
        </Text>
        {selectedTask && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <XCircle size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        <ChevronRight size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Task</Text>
            <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }}>
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.searchRow}>
            <Search size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.taskItem,
                  selectedTaskId === item.id && styles.taskItemSelected,
                ]}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.taskItemContent}>
                  <Text style={styles.taskName} numberOfLines={1}>
                    {item.name || 'Untitled'}
                  </Text>
                  <Text style={styles.taskPath} numberOfLines={1}>
                    {getTaskPath(item.id)}
                  </Text>
                </View>
                {selectedTaskId === item.id && (
                  <CheckCircle size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No tasks found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  selectorText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_400Regular',
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontFamily: 'DMSans_700Bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_400Regular',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  taskItemSelected: {
    backgroundColor: Colors.surface,
  },
  taskItemContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  taskName: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_500Medium',
  },
  taskPath: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_400Regular',
  },
});
