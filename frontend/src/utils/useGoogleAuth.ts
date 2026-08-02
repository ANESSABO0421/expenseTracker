import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useStore } from '../store/useStore';

WebBrowser.maybeCompleteAuthSession();

// Helper to reliably generate the reversed client ID scheme
const getRedirectUri = (clientId?: string) => {
  if (!clientId) return undefined;
  const parts = clientId.split('.');
  return `com.googleusercontent.apps.${parts[0]}:/oauth2redirect`;
};

const iosRedirectUri = getRedirectUri(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
const androidRedirectUri = getRedirectUri(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);

const isStaleAuthCallback = (error: unknown) =>
  error instanceof Error &&
  error.message.toLowerCase().includes('cached state and returned state do not match');

export const useGoogleAuth = () => {
  const { googleLogin } = useStore();

  const redirectUri = iosRedirectUri;

  console.log('Using Redirect URI:', redirectUri ?? 'Expo default for this platform');

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // Masquerade as iOS Client to bypass Google restriction
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      const accessToken = response.authentication.accessToken;
      if (accessToken) fetchGoogleUserInfo(accessToken);
    } else if (response?.type === 'error') {
      if (isStaleAuthCallback(response.error)) {
        console.warn('Ignored stale Google auth callback. Start sign-in again.');
        return;
      }
      console.warn('Google auth failed:', response.error);
    }
  }, [response]);

  const fetchGoogleUserInfo = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userInfo = await res.json();

      googleLogin(
        userInfo.sub,
        userInfo.email,
        userInfo.name || 'Google User',
        userInfo.picture || undefined
      );
    } catch (e) {
      console.warn('Failed to fetch Google UserInfo:', e);
    }
  };

  const startGoogleSignIn = async () => {
    try {
      WebBrowser.dismissAuthSession();
    } catch {
      // No active auth session to dismiss.
    }
    return promptAsync();
  };

  return {
    promptAsync: startGoogleSignIn,
    isDisabled: !request,
  };
};
