import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useStore } from '../store/useStore';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const { googleLogin } = useStore();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      const accessToken = response.authentication.accessToken;
      fetchGoogleUserInfo(accessToken);
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
      console.error('Failed to fetch Google UserInfo:', e);
    }
  };

  return {
    promptAsync,
    isDisabled: !request,
  };
};
