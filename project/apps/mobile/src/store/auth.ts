import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { User } from '../types/api';
import { sanitizeName } from '../utils/text';

const STORAGE_KEYS = {
  token: 'auth_token',
  user: 'user',
} as const;

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

const sanitizeUserProfile = (user: User | null): User | null => {
  if (!user) {
    return null;
  }

  const sanitizedDisplayName = sanitizeName(user.displayName ?? null);
  const sanitizedUsername = sanitizeName(user.username ?? null);
  const trimmedAvatarUrl = user.avatarUrl?.trim();

  return {
    ...user,
    email: user.email.trim(),
    displayName: sanitizedDisplayName.length > 0 ? sanitizedDisplayName : undefined,
    username: sanitizedUsername.length > 0 ? sanitizedUsername : undefined,
    avatarUrl: trimmedAvatarUrl && trimmedAvatarUrl.length > 0 ? trimmedAvatarUrl : undefined,
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => {
    const sanitizedUser = sanitizeUserProfile(user);
    set({ user: sanitizedUser, isAuthenticated: !!sanitizedUser });
  },
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),

  login: async (user, token) => {
    const sanitizedUser = sanitizeUserProfile(user);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.token, token],
      [STORAGE_KEYS.user, JSON.stringify(sanitizedUser)],
    ]);
    set({ user: sanitizedUser, token, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
    set({ user: null, token: null, isAuthenticated: false });
  },

  initialize: async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.token),
        AsyncStorage.getItem(STORAGE_KEYS.user),
      ]);

      let token: string | null = null;
  let user: User | null = null;

      if (storedToken && storedToken !== 'undefined' && storedToken !== 'null' && storedToken.trim() !== '') {
        token = storedToken;
      } else if (storedToken) {
        await AsyncStorage.removeItem(STORAGE_KEYS.token);
      }

      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          user = sanitizeUserProfile(parsedUser);
        } catch (parseError) {
          console.warn('[AuthStore] Failed to parse stored user. Clearing persisted value.', parseError);
          await AsyncStorage.removeItem(STORAGE_KEYS.user);
        }
      } else if (storedUser) {
        await AsyncStorage.removeItem(STORAGE_KEYS.user);
      }

      set({
        user,
        token,
        isAuthenticated: Boolean(user && token),
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));