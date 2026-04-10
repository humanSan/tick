import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import { Session } from '../types';
import { formatDuration, formatDateShort, formatTime } from '../utils';

interface SessionCardProps {
  session: Session;
  onPress: () => void;
}

export default function SessionCard({ session, onPress }: SessionCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>
          {session.name || 'Untitled Session'}
        </Text>
        <Text style={styles.duration}>{formatDuration(session.duration)}</Text>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.date}>
          {formatDateShort(session.startTime)} · {formatTime(session.startTime)}
        </Text>
        {session.tags.length > 0 && (
          <View style={styles.tagRow}>
            {session.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {session.tags.length > 3 && (
              <Text style={styles.moreTag}>+{session.tags.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  name: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_600SemiBold',
    marginRight: Spacing.sm,
  },
  duration: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: 'SpaceGrotesk_700Bold',
    fontVariant: ['tabular-nums'],
  },
  tagRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: Colors.tagBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontFamily: 'DMSans_500Medium',
  },
  moreTag: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: 'DMSans_500Medium',
  },
});
