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
  receiptUrl?: string;
}

export interface Insight {
  title: string;
  message: string;
  icon: string;
  color: string;
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
  insights: Insight[];
  isGeneratingInsights: boolean;
  generateInsights: (transactions: Transaction[]) => Promise<void>;
  
  // Premium Features
  currency: string;
  exchangeRates: Record<string, number>;
  enableConversion: boolean;
  setCurrency: (currency: string) => void;
  setEnableConversion: (val: boolean) => void;
  fetchExchangeRates: () => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;

  // Global Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  transactions: [],
  isLoading: false,
  error: null,
  insights: [],
  isGeneratingInsights: false,
  currency: 'USD',
  exchangeRates: { 'USD': 1 },
  enableConversion: false,
  theme: 'light',

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem('app_theme', newTheme);
      return { theme: newTheme };
    });
  },

  restoreSession: async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user_session');
      const storedCurrency = await AsyncStorage.getItem('user_currency');
      const storedConv = await AsyncStorage.getItem('user_enable_conv');
      const storedTheme = await AsyncStorage.getItem('app_theme') as 'light' | 'dark' | null;
      
      if (storedUser) {
        set({ user: JSON.parse(storedUser) });
      }
      if (storedCurrency) {
        set({ currency: storedCurrency });
      }
      if (storedConv) {
        set({ enableConversion: storedConv === 'true' });
      }
      if (storedTheme) {
        set({ theme: storedTheme });
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
  },

  generateInsights: async (transactions) => {
    set({ isGeneratingInsights: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/insights`, { transactions });
      set({ insights: response.data.data, isGeneratingInsights: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to generate insights', isGeneratingInsights: false });
    }
  },

  setCurrency: async (currency) => {
    set({ currency });
    await AsyncStorage.setItem('user_currency', currency);
  },

  setEnableConversion: async (val) => {
    set({ enableConversion: val });
    await AsyncStorage.setItem('user_enable_conv', val.toString());
  },

  fetchExchangeRates: async () => {
    const { currency } = useStore.getState();
    try {
      // Using Frankfurter API (Free, no auth required, base EUR by default but we can request base)
      const res = await axios.get(`https://api.frankfurter.app/latest?from=USD`);
      // Frankfurter doesn't include the base in the rates object, so we add it manually
      const rates = { ...res.data.rates, USD: 1 };
      
      // If the user selected a base currency other than USD, we just recalculate relative to USD 
      // Actually, to make it simple, we store all rates relative to USD, and then in the UI we multiply by `exchangeRates[currency]`
      set({ exchangeRates: rates });
    } catch (error) {
      console.error('Failed to fetch exchange rates', error);
    }
  },

  deleteTransaction: async (id) => {
    try {
      await axios.delete(`${API_URL}/transactions/${id}`);
      set((state) => ({
        transactions: state.transactions.filter(t => t._id !== id)
      }));
      Toast.show({ type: 'success', text1: 'Deleted', text2: 'Transaction removed successfully' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete transaction' });
    }
  },

  updateTransaction: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/transactions/${id}`, data);
      set((state) => ({
        transactions: state.transactions.map(t => t._id === id ? response.data.data : t)
      }));
      Toast.show({ type: 'success', text1: 'Updated', text2: 'Transaction updated successfully' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update transaction' });
    }
  }
}));
