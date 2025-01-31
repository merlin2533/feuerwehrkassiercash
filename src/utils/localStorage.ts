import type { Event } from "@/components/EventSelector";
import type { Transaction } from "@/components/TransactionList";

export interface LocalBalance {
  event_id: string;
  cash_balance: number;
  bank_balance: number;
}

export const saveTransactions = (transactions: Transaction[]) => {
  localStorage.setItem('transactions', JSON.stringify(transactions));
};

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem('transactions');
  return stored ? JSON.parse(stored) : [];
};

export const saveEvents = (events: Event[]) => {
  localStorage.setItem('events', JSON.stringify(events));
};

export const getEvents = (): Event[] => {
  const stored = localStorage.getItem('events');
  return stored ? JSON.parse(stored) : [];
};

export const saveBalances = (balances: LocalBalance[]) => {
  localStorage.setItem('balances', JSON.stringify(balances));
};

export const getBalances = (): LocalBalance[] => {
  const stored = localStorage.getItem('balances');
  return stored ? JSON.parse(stored) : [];
};