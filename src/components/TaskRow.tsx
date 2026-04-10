import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react-native';
import { Colors, Spacing, FontSize } from '../theme';
import { Task } from '../types';
import { useTasks } from '../store/TaskContext';
import AnimatedCheckbox from './AnimatedCheckbox';

interface TaskRowProps {
  task: Task;
  expanded: boolean;
  hasChildren: boolean;
  onToggleExpand: () => void;
  onPress: () => void;
  onToggleComplete: () => void;
  onAddSubtask: () => void;
}

export default function TaskRow({
  task,
  expanded,
  hasChildren,
  onToggleExpand,
  onPress,
  onToggleComplete,
  onAddSubtask,
}: TaskRowProps) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.expandBtn}
        onPress={hasChildren ? onToggleExpand : onAddSubtask}
        activeOpacity={0.6}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown size={18} color={Colors.textSecondary} />
          ) : (
            <ChevronRight size={18} color={Colors.textSecondary} />
          )
        ) : (
          <Plus size={16} color={Colors.textMuted} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.nameArea} onPress={onPress} activeOpacity={0.6}>
        <Text
          style={[
            styles.name,
            task.completed && styles.nameCompleted,
          ]}
          numberOfLines={1}
        >
          {task.name || 'Untitled'}
        </Text>
        {task.tags.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {task.tags.join(', ')}
          </Text>
        )}
      </TouchableOpacity>

      <AnimatedCheckbox
        checked={task.completed}
        onToggle={onToggleComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  expandBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  nameArea: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_500Medium',
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  tags: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontFamily: 'DMSans_400Regular',
    marginTop: 1,
  },
});
