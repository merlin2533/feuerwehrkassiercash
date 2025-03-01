
import type { Event } from "@/components/EventSelector";
import type { Transaction } from "@/components/TransactionList";

export interface CashRegisterBalance {
  id: string;
  name: string;
  balance: number;
}

export interface LocalBalance {
  event_id: string;
  registers: CashRegisterBalance[];
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

// Function to save custom registers (for global use)
export const saveCustomRegisters = (registers: CashRegisterBalance[]) => {
  localStorage.setItem('customRegisters', JSON.stringify(registers));
};

// Function to get custom registers
export const getCustomRegisters = (): CashRegisterBalance[] => {
  const stored = localStorage.getItem('customRegisters');
  return stored ? JSON.parse(stored) : [];
};

// Default cash registers
export const DEFAULT_REGISTERS = [
  { id: "bar1", name: "Bar 1", balance: 0 },
  { id: "bar2", name: "Bar 2", balance: 0 },
  { id: "bar3", name: "Bar 3", balance: 0 },
  { id: "bar4", name: "Bar 4", balance: 0 },
  { id: "karten", name: "Karten", balance: 0 },
  { id: "bierstand", name: "Bierstand", balance: 0 },
  { id: "essenstand", name: "Essenstand", balance: 0 },
  { id: "alkoholfrei", name: "Alkoholfrei", balance: 0 },
  { id: "gardarobe", name: "Gardarobe", balance: 0 },
  { id: "kassier", name: "Kassier", balance: 0 }
];

// Reset event data
export const resetEvent = (eventId: string): boolean => {
  try {
    // Get all transactions and filter out the ones for the event
    const allTransactions = getTransactions();
    const filteredTransactions = allTransactions.filter(t => t.event_id !== eventId);
    saveTransactions(filteredTransactions);
    
    // Reset the balances for the event
    const allBalances = getBalances();
    const updatedBalances = allBalances.map(balance => {
      if (balance.event_id === eventId) {
        // Reset register balances to 0
        const resetRegisters = balance.registers.map(register => ({
          ...register,
          balance: 0
        }));
        
        return {
          ...balance,
          registers: resetRegisters,
          bank_balance: 0
        };
      }
      return balance;
    });
    
    saveBalances(updatedBalances);
    return true;
  } catch (error) {
    console.error("Error resetting event:", error);
    return false;
  }
};
