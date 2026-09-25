import type { Ionicons } from '@expo/vector-icons';
import type { Transaction } from '../store/useStore';

type IconName = keyof typeof Ionicons.glyphMap;

export interface CategoryMeta {
  icon: IconName;
  color: string;
}

// Keyed by lowercase category name. Covers the quick-pick categories, the
// voice parser's categories and common free-text variants.
const META: Record<string, CategoryMeta> = {
  food: { icon: 'fast-food', color: '#FF6B2C' },
  groceries: { icon: 'basket', color: '#F79009' },
  transport: { icon: 'car-sport', color: '#2E90FA' },
  shopping: { icon: 'bag-handle', color: '#EE46BC' },
  bills: { icon: 'receipt', color: '#F5B400' },
  utilities: { icon: 'flash', color: '#F5B400' },
  rent: { icon: 'home', color: '#875BF7' },
  health: { icon: 'fitness', color: '#12B76A' },
  entertainment: { icon: 'film', color: '#7A5AF8' },
  travel: { icon: 'airplane', color: '#06AED4' },
  education: { icon: 'school', color: '#6172F3' },
  salary: { icon: 'briefcase', color: '#12B76A' },
  freelance: { icon: 'laptop', color: '#0BA5EC' },
  investment: { icon: 'trending-up', color: '#16B364' },
  gift: { icon: 'gift', color: '#F63D68' },
  rental: { icon: 'key', color: '#EF6820' },
  business: { icon: 'storefront', color: '#4E5BA6' },
  other: { icon: 'apps', color: '#8E92A4' },
};

const FALLBACK_COLORS = ['#FF6B2C', '#2E90FA', '#7A5AF8', '#12B76A', '#EE46BC', '#06AED4', '#F5B400', '#F04438'];

export function categoryMeta(name?: string): CategoryMeta {
  const key = (name || 'other').trim().toLowerCase();
  if (META[key]) return META[key];
  // Stable colour for unknown free-text categories
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return { icon: 'pricetag', color: FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length] };
}

export const QUICK_CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Travel', 'Other'],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Rental', 'Business', 'Other'],
};

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return 'Today';
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday';
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export interface DaySection {
  key: string;
  title: string;
  net: number;
  data: Transaction[];
}

/** Groups transactions (newest first) into day sections with a net total. */
export function groupByDay(transactions: Transaction[]): DaySection[] {
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sections: DaySection[] = [];
  const index = new Map<string, DaySection>();
  sorted.forEach(t => {
    const d = new Date(t.date);
    const key = dayKey(d);
    let section = index.get(key);
    if (!section) {
      section = { key, title: dayLabel(d), net: 0, data: [] };
      index.set(key, section);
      sections.push(section);
    }
    section.data.push(t);
    section.net += t.type === 'income' ? t.amount : -t.amount;
  });
  return sections;
}
