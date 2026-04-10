import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { CornerDownRight, Menu, Layers, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/theme';
import { useTasks } from '../../src/store/TaskContext';
import { Task } from '../../src/types';
import TaskRow from '../../src/components/TaskRow';

export default function TasksScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { tasks, addTask, updateTask, getSubtasks } = useTasks();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [addingRoot, setAddingRoot] = useState(false);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleComplete = useCallback((task: Task) => {
    updateTask({ ...task, completed: !task.completed });
  }, [updateTask]);

  const handleAddSubtask = useCallback((parentId: string | null) => {
    if (parentId) {
      setAddingSubtaskFor(parentId);
      setAddingRoot(false);
    } else {
      setAddingRoot(true);
      setAddingSubtaskFor(null);
    }
    setNewTaskName('');
  }, []);

  const submitNewTask = useCallback((parentId: string | null) => {
    const name = newTaskName.trim();
    if (!name) {
      setAddingSubtaskFor(null);
      setAddingRoot(false);
      return;
    }
    const task = addTask({
      name,
      parentId,
      tags: [],
      info: '',
      completed: false,
    });
    if (parentId) {
      setExpanded((prev) => new Set(prev).add(parentId));
    }
    setAddingSubtaskFor(null);
    setAddingRoot(false);
    setNewTaskName('');
  }, [newTaskName, addTask]);

  const renderTaskTree = (parentId: string | null, depth: number = 0): React.ReactNode[] => {
    const children = getSubtasks(parentId);
    const nodes: React.ReactNode[] = [];

    children.forEach((task) => {
      const taskChildren = getSubtasks(task.id);
      const hasChildren = taskChildren.length > 0;
      const isExpanded = expanded.has(task.id);

      nodes.push(
        <TaskRow
          key={task.id}
          task={task}
          expanded={isExpanded}
          hasChildren={hasChildren}
          onToggleExpand={() => toggleExpand(task.id)}
          onPress={() =>
            router.push({
              pathname: '/task-edit',
              params: { taskId: task.id },
            })
          }
          onToggleComplete={() => handleToggleComplete(task)}
          onAddSubtask={() => handleAddSubtask(task.id)}
        />
      );

      // Inline add subtask input
      if (addingSubtaskFor === task.id) {
        nodes.push(
          <View key={`add-${task.id}`} style={styles.inlineAdd}>
            <CornerDownRight size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <TextInput
              style={styles.inlineInput}
              placeholder="Subtask name..."
              placeholderTextColor={Colors.textMuted}
              value={newTaskName}
              onChangeText={setNewTaskName}
              onSubmitEditing={() => submitNewTask(task.id)}
              onBlur={() => submitNewTask(task.id)}
              autoFocus
              returnKeyType="done"
            />
          </View>
        );
      }

      if (isExpanded && hasChildren) {
        // Vertical spacer to denote subtask group
        nodes.push(
          <View key={`spacer-start-${task.id}`} style={styles.subtaskGroupStart} />
        );
        nodes.push(...renderTaskTree(task.id, depth + 1));
        nodes.push(
          <View key={`spacer-end-${task.id}`} style={styles.subtaskGroupEnd} />
        );
      }
    });

    return nodes;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Menu size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tasks</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {renderTaskTree(null)}

        {addingRoot && (
          <View style={styles.inlineAdd}>
            <TextInput
              style={styles.inlineInput}
              placeholder="Task name..."
              placeholderTextColor={Colors.textMuted}
              value={newTaskName}
              onChangeText={setNewTaskName}
              onSubmitEditing={() => submitNewTask(null)}
              onBlur={() => submitNewTask(null)}
              autoFocus
              returnKeyType="done"
            />
          </View>
        )}

        {tasks.filter((t) => t.parentId === null).length === 0 && !addingRoot && (
          <View style={styles.empty}>
            <Layers size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first task</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        onPress={() => handleAddSubtask(null)}
        activeOpacity={0.8}
      >
        <Plus size={28} color={Colors.white} />
      </TouchableOpacity>
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
  list: {
    flex: 1,
  },
  subtaskGroupStart: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    opacity: 0.5,
    marginTop: 2,
  },
  subtaskGroupEnd: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
    borderRadius: 2,
    opacity: 0.5,
    marginBottom: 2,
  },
  inlineAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginVertical: 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inlineInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_400Regular',
    paddingVertical: 4,
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
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
