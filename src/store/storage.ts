import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SESSIONS: '@tick/sessions',
  TASKS: '@tick/tasks',
} as const;

export async function loadData<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
    return null;
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

export { KEYS };
