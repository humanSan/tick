import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Keyboard,
} from 'react-native';
import { XCircle, Tag, PlusCircle } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import { useTags } from '../store/TagContext';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const { allTags } = useTags();
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const filtered = query.trim()
    ? allTags.filter(
        (t) =>
          t.toLowerCase().includes(query.toLowerCase()) && !tags.includes(t)
      )
    : allTags.filter((t) => !tags.includes(t));

  const exactMatch = allTags.some(
    (t) => t.toLowerCase() === query.trim().toLowerCase()
  );

  const handleSelect = (tag: string) => {
    if (!tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setQuery('');
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const handleCreate = () => {
    const trimmed = query.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setQuery('');
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const handleRemove = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <View style={styles.container}>
      {tags.length > 0 && (
        <View style={styles.chipRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>{tag}</Text>
              <TouchableOpacity onPress={() => handleRemove(tag)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <XCircle size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.inputRow}>
        <Tag size={18} color={Colors.textSecondary} style={styles.icon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Add a tag..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
      </View>
      {showDropdown && (query.trim() || filtered.length > 0) && (
        <View style={styles.dropdown}>
          <FlatList
            data={filtered.slice(0, 5)}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSelect(item)}>
                <Text style={styles.dropdownText}>{item}</Text>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              query.trim() && !exactMatch ? (
                <TouchableOpacity style={styles.dropdownItem} onPress={handleCreate}>
                  <PlusCircle size={16} color={Colors.primary} />
                  <Text style={[styles.dropdownText, { color: Colors.primary, marginLeft: 6 }]}>
                    Create "{query.trim()}"
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tagBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  chipText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontFamily: 'DMSans_500Medium',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_400Regular',
  },
  dropdown: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  dropdownText: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_400Regular',
  },
});
