import Constants from 'expo-constants';

export const Config = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
    'http://localhost:3000/api/v1',
} as const;
