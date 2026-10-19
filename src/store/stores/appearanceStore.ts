import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type AppearancePreference = 'system' | 'light' | 'dark';
export function parseAppearance(value: unknown): AppearancePreference {
  return value === 'light' || value === 'dark' ? value : 'system';
}
type Storage = { read: () => Promise<string | null>; write: (value: string) => Promise<void> };
type State = {
  preference: AppearancePreference; hydrated: boolean; saving: boolean; error: string; failure: 'restore' | 'save' | null;
  hydrate: () => Promise<void>; setPreference: (value: AppearancePreference) => Promise<void>;
};

/** Device preference, independent of accounts. Serialize saves; late restore cannot undo a selection. */
export function createAppearanceStore(storage: Storage) {
  let revision = 0;
  let writes = Promise.resolve();
  return create<State>((set) => ({
    preference: 'system', hydrated: false, saving: false, error: '', failure: null,
    async hydrate() {
      const started = revision;
      try {
        const value = await storage.read();
        if (started === revision) set({ preference: parseAppearance(value), error: '', failure: null });
      } catch {
        if (started === revision) set({ error: 'Appearance could not be restored. Try again or choose a mode.', failure: 'restore' });
      } finally { set({ hydrated: true }); }
    },
    async setPreference(value) {
      const preference = parseAppearance(value);
      const current = ++revision;
      set({ preference, saving: true, error: '', failure: null });
      const save = writes.then(() => storage.write(preference));
      writes = save.catch(() => {});
      try { await save; }
      catch { if (current === revision) set({ error: 'Appearance is applied, but could not be saved on this device. Try saving again.', failure: 'save' }); }
      finally { if (current === revision) set({ saving: false }); }
    },
  }));
}
const key = 'examquest.appearance';
export const useAppearance = createAppearanceStore({
  async read() { return Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key); },
  async write(value) {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
});
