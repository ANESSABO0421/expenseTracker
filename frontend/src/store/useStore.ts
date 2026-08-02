import { create } from 'zustand';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

// Set this to your computer's local WiFi IP address if testing on a physical device
// Your Metro bundler runs on 192.168.1.4, so we use that.
const API_URL = 'http://192.168.1.4:5001/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
  avatar?: string;
}

export interface Transaction {
  _id: string;
  user: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: string;
}

interface AppState {
  user: User | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  restoreSession: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (googleId: string, email: string, name: string, avatar?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, '_id' | 'date'>) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  transactions: [],
  isLoading: false,
  error: null,

  restoreSession: async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_session');
      if (storedUser) {
        set({ user: JSON.parse(storedUser) });
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      const userData = response.data;
      await AsyncStorage.setItem('user_session', JSON.stringify(userData));
      set({ user: userData, isLoading: false });
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Your account has been created successfully.',
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to register';
      set({ error: errorMsg, isLoading: false });
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: errorMsg,
      });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const userData = response.data;
      await AsyncStorage.setItem('user_session', JSON.stringify(userData));
      set({ user: userData, isLoading: false });
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'You have successfully logged in.',
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to login';
      set({ error: errorMsg, isLoading: false });
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMsg,
      });
    }
  },

  googleLogin: async (googleId, email, name, avatar) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/google`, { googleId, email, name, avatar });
      const userData = response.data;
      await AsyncStorage.setItem('user_session', JSON.stringify(userData));
      set({ user: userData, isLoading: false });
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: `You are logged in as ${name}.`,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed Google Login';
      set({ error: errorMsg, isLoading: false });
      Toast.show({
        type: 'error',
        text1: 'Google Login Failed',
        text2: errorMsg,
      });
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('user_session');
      set({ user: null, transactions: [] });
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  },

  fetchTransactions: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/transactions/user/${userId}`);
      set({ transactions: response.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch transactions', isLoading: false });
    }
  },

  addTransaction: async (transactionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/transactions`, transactionData);
      const newTransaction = response.data.data;
      set((state) => ({
        transactions: [newTransaction, ...state.transactions],
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to add transaction', isLoading: false });
    }
  }
}));
