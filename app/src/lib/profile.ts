import AsyncStorage from '@react-native-async-storage/async-storage';

const DISPLAY_NAME_KEY = 'unme_display_name';

export async function getDisplayName(): Promise<string> {
  const stored = await AsyncStorage.getItem(DISPLAY_NAME_KEY);
  return stored ?? 'Anonymous';
}

export async function setDisplayName(name: string): Promise<void> {
  await AsyncStorage.setItem(DISPLAY_NAME_KEY, name.trim() || 'Anonymous');
}