import { create } from 'zustand';
import axios from 'axios';

// Set this to your computer's local IP address if testing on a physical device
const API_URL = 'http://localhost:5001/api'; 

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
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchTransactions: (userId: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, '_id' | 'date'>) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,

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
