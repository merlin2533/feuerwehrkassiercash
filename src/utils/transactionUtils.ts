
import { v4 as uuidv4 } from 'uuid';
import type { Transaction } from "@/components/TransactionList";
import type { Event } from "@/components/EventSelector";
import type { CashRegisterBalance, LocalBalance } from "@/utils/localStorage";
import { getTransactions, saveTransactions, getBalances, saveBalances } from "@/utils/localStorage";

// Create a new transaction
export const createTransaction = (
  eventId: string, 
  amount: number, 
  type: "deposit" | "withdrawal",
  source: string | null,
  target: string,
  comment: string
): Transaction => {
  return {
    id: crypto.randomUUID(), // Using the Web Crypto API instead of uuid
    event_id: eventId,
    amount,
    type,
    ...(source && { source }),
    target,
    comment: comment || (type === "deposit" ? "Einzahlung" : `Abhebung (${target})`),
    created_at: new Date().toISOString()
  };
};

// Process a deposit transaction
export const processDeposit = (
  event: Event,
  amount: number,
  sourceRegisterId: string,
  comment: string,
  registers: CashRegisterBalance[]
) => {
  const sourceRegister = registers.find(r => r.id === sourceRegisterId);
  if (!sourceRegister) return { success: false, message: "Kasse nicht gefunden." };
  
  // Create new transaction
  const newTransaction = createTransaction(
    event.id,
    amount,
    "deposit",
    null,
    sourceRegister.name,
    comment
  );

  // Update transactions
  const allTransactions = getTransactions();
  const newTransactions = [...allTransactions, newTransaction];
  saveTransactions(newTransactions);

  // Update balances
  const balances = getBalances();
  const currentBalance = balances.find(b => b.event_id === event.id);
  
  if (currentBalance) {
    const updatedRegisters = currentBalance.registers.map(register => {
      if (register.id === sourceRegisterId) {
        return { ...register, balance: register.balance + amount };
      }
      return register;
    });
    
    const newBalances = balances.map(b => 
      b.event_id === event.id 
        ? { ...b, registers: updatedRegisters }
        : b
    );
    
    saveBalances(newBalances);
    return { 
      success: true, 
      message: `${amount.toFixed(2)}€ wurden eingezahlt.`,
      updatedBalances: newBalances
    };
  }
  
  return { success: false, message: "Fehler beim Aktualisieren der Salden." };
};

// Process a withdrawal transaction
export const processWithdrawal = (
  event: Event,
  amount: number,
  sourceRegisterId: string,
  targetRegisterId: string | null,
  toBank: boolean,
  comment: string,
  registers: CashRegisterBalance[]
) => {
  const sourceRegister = registers.find(r => r.id === sourceRegisterId);
  
  if (!sourceRegister) {
    return { success: false, message: "Kasse nicht gefunden." };
  }

  if (amount > sourceRegister.balance) {
    return { success: false, message: "Nicht genügend Geld in der Kasse." };
  }

  // Define target for transfer
  let target = toBank ? "Bank" : "Bar Entnahme";
  let targetRegister = null;
  
  if (!toBank && targetRegisterId) {
    targetRegister = registers.find(r => r.id === targetRegisterId);
    if (targetRegister) {
      target = targetRegister.name;
    } else {
      return { success: false, message: "Zielkasse nicht gefunden." };
    }
  }

  // Create new transaction
  const newTransaction = createTransaction(
    event.id,
    amount,
    "withdrawal",
    sourceRegister.name,
    target,
    comment
  );

  // Update transactions
  const allTransactions = getTransactions();
  const newTransactions = [...allTransactions, newTransaction];
  saveTransactions(newTransactions);

  // Update balances
  const balances = getBalances();
  const currentBalance = balances.find(b => b.event_id === event.id);
  
  if (currentBalance) {
    // Update source register
    let updatedRegisters = currentBalance.registers.map(register => {
      if (register.id === sourceRegisterId) {
        return { ...register, balance: register.balance - amount };
      }
      return register;
    });
    
    // Update target register if applicable
    if (targetRegisterId) {
      updatedRegisters = updatedRegisters.map(register => {
        if (register.id === targetRegisterId) {
          return { ...register, balance: register.balance + amount };
        }
        return register;
      });
    }
    
    // Update bank balance if applicable
    const newBankBalance = toBank 
      ? currentBalance.bank_balance + amount 
      : currentBalance.bank_balance;
    
    const newBalances = balances.map(b => 
      b.event_id === event.id 
        ? { ...b, registers: updatedRegisters, bank_balance: newBankBalance }
        : b
    );
    
    saveBalances(newBalances);
    
    return { 
      success: true,
      message: `${amount.toFixed(2)}€ wurden von ${sourceRegister.name} ${toBank ? "zur Bank überwiesen" : targetRegisterId ? `zu ${target} transferiert` : "entnommen"}.`,
      updatedBalances: newBalances
    };
  }
  
  return { success: false, message: "Fehler beim Aktualisieren der Salden." };
};

// Recalculate balances from transactions
export const recalculateBalances = (
  event: Event,
  currentBalances: LocalBalance[],
) => {
  const allTransactions = getTransactions();
  const currentBalance = currentBalances.find(b => b.event_id === event.id);
  
  if (!currentBalance) {
    return { success: false, message: "Aktuelle Saldendaten nicht gefunden." };
  }
  
  // Create a copy of registers to update
  const updatedRegisters = [...currentBalance.registers];
  let newBankBalance = 0; // Start with zero and recalculate
  
  // Reset all balances to zero first
  for (let i = 0; i < updatedRegisters.length; i++) {
    updatedRegisters[i] = { ...updatedRegisters[i], balance: 0 };
  }
  
  // Recalculate from all transactions
  allTransactions
    .filter(t => t.event_id === event.id)
    .forEach(t => {
      if (t.type === "deposit") {
        // Find the register by name
        const registerIndex = updatedRegisters.findIndex(
          r => r.name === t.target
        );
        
        if (registerIndex >= 0) {
          updatedRegisters[registerIndex].balance += t.amount;
        }
      } else { // withdrawal
        // Find source register by name
        const sourceRegisterIndex = updatedRegisters.findIndex(
          r => r.name === t.source
        );
        
        if (sourceRegisterIndex >= 0) {
          updatedRegisters[sourceRegisterIndex].balance -= t.amount;
        }
        
        // If target is bank, update bank balance
        if (t.target === "Bank") {
          newBankBalance += t.amount;
        } else if (t.target !== "Bar Entnahme") {
          // If target is another register, update that register
          const targetRegisterIndex = updatedRegisters.findIndex(
            r => r.name === t.target
          );
          
          if (targetRegisterIndex >= 0) {
            updatedRegisters[targetRegisterIndex].balance += t.amount;
          }
        }
      }
    });
  
  // Update balances
  const newBalances = currentBalances.map(b => 
    b.event_id === event.id 
      ? { ...b, registers: updatedRegisters, bank_balance: newBankBalance }
      : b
  );
  
  saveBalances(newBalances);
  return { 
    success: true, 
    message: "Salden wurden neu berechnet.",
    updatedBalances: newBalances 
  };
};
