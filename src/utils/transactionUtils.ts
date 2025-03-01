
import type { Transaction } from "@/components/TransactionList";
import type { Event } from "@/components/EventSelector";
import type { CashRegisterBalance, LocalBalance } from "@/utils/localStorage";
import type { Denomination } from "@/types/models";
import { getTransactions, saveTransactions, getBalances, saveBalances } from "@/utils/localStorage";

// Create a new transaction
export const createTransaction = (
  eventId: string, 
  amount: number, 
  type: "deposit" | "withdrawal",
  source: string | null,
  target: string,
  comment: string,
  denominations?: Denomination[]
): Transaction => {
  return {
    id: crypto.randomUUID(),
    event_id: eventId,
    amount,
    type,
    ...(source && { source }),
    target,
    comment: comment || (type === "deposit" ? "Einzahlung" : `Abhebung (${target})`),
    created_at: new Date().toISOString(),
    ...(denominations && { denominations })
  };
};

// Process a deposit transaction
export const processDeposit = (
  event: Event,
  amount: number,
  sourceRegisterId: string,
  comment: string,
  registers: CashRegisterBalance[],
  denominations?: Denomination[]
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
    comment,
    denominations
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
        // Update register denominations
        let updatedDenominations = register.denominations || [];
        
        if (denominations && denominations.length > 0) {
          // Create a map of existing denominations
          const denominationMap = new Map<number, Denomination>();
          updatedDenominations.forEach(d => denominationMap.set(d.value, d));
          
          // Update or add new denominations
          denominations.forEach(d => {
            if (d.count > 0) {
              const existing = denominationMap.get(d.value);
              if (existing) {
                denominationMap.set(d.value, {
                  value: d.value,
                  count: existing.count + d.count
                });
              } else {
                denominationMap.set(d.value, d);
              }
            }
          });
          
          // Convert map back to array
          updatedDenominations = Array.from(denominationMap.values());
        }
        
        return { 
          ...register, 
          balance: register.balance + amount,
          denominations: updatedDenominations
        };
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
  registers: CashRegisterBalance[],
  denominations?: Denomination[]
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
    comment,
    denominations
  );

  // Update transactions
  const allTransactions = getTransactions();
  const newTransactions = [...allTransactions, newTransaction];
  saveTransactions(newTransactions);

  // Update balances
  const balances = getBalances();
  const currentBalance = balances.find(b => b.event_id === event.id);
  
  if (currentBalance) {
    // Update source register (reduce denominations based on withdrawal)
    let updatedRegisters = currentBalance.registers.map(register => {
      if (register.id === sourceRegisterId) {
        // Update register denominations
        let updatedDenominations = register.denominations || [];
        
        if (denominations && denominations.length > 0) {
          // Create a map of existing denominations
          const denominationMap = new Map<number, Denomination>();
          updatedDenominations.forEach(d => denominationMap.set(d.value, d));
          
          // Reduce denominations based on withdrawal
          denominations.forEach(d => {
            if (d.count > 0) {
              const existing = denominationMap.get(d.value);
              if (existing) {
                const newCount = existing.count - d.count;
                if (newCount > 0) {
                  denominationMap.set(d.value, {
                    value: d.value,
                    count: newCount
                  });
                } else {
                  denominationMap.delete(d.value);
                }
              }
            }
          });
          
          // Convert map back to array
          updatedDenominations = Array.from(denominationMap.values());
        }
        
        return { 
          ...register, 
          balance: register.balance - amount,
          denominations: updatedDenominations 
        };
      }
      return register;
    });
    
    // Update target register if applicable
    if (targetRegisterId) {
      updatedRegisters = updatedRegisters.map(register => {
        if (register.id === targetRegisterId) {
          // Update target register denominations
          let updatedDenominations = register.denominations || [];
          
          if (denominations && denominations.length > 0) {
            // Create a map of existing denominations
            const denominationMap = new Map<number, Denomination>();
            updatedDenominations.forEach(d => denominationMap.set(d.value, d));
            
            // Add denominations to target
            denominations.forEach(d => {
              if (d.count > 0) {
                const existing = denominationMap.get(d.value);
                if (existing) {
                  denominationMap.set(d.value, {
                    value: d.value,
                    count: existing.count + d.count
                  });
                } else {
                  denominationMap.set(d.value, d);
                }
              }
            });
            
            // Convert map back to array
            updatedDenominations = Array.from(denominationMap.values());
          }
          
          return { 
            ...register, 
            balance: register.balance + amount,
            denominations: updatedDenominations 
          };
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

// Delete a transaction
export const deleteTransaction = (
  eventId: string,
  transactionId: string
) => {
  // Get all transactions
  const allTransactions = getTransactions();
  const transactionToDelete = allTransactions.find(t => t.id === transactionId);
  
  if (!transactionToDelete) {
    return { success: false, message: "Transaktion nicht gefunden." };
  }
  
  // Remove the transaction
  const newTransactions = allTransactions.filter(t => t.id !== transactionId);
  saveTransactions(newTransactions);
  
  // Recalculate balances
  const balances = getBalances();
  const result = recalculateBalances({ id: eventId } as Event, balances);
  
  if (result.success) {
    return {
      success: true,
      message: "Transaktion erfolgreich gelöscht.",
      updatedBalances: result.updatedBalances
    };
  }
  
  return { success: false, message: "Fehler beim Neuberechnen der Salden." };
};

// Update a transaction
export const updateTransaction = (
  originalTransaction: Transaction,
  updatedTransaction: Transaction
) => {
  // Get all transactions
  const allTransactions = getTransactions();
  
  // Update the transaction
  const newTransactions = allTransactions.map(t => 
    t.id === updatedTransaction.id ? updatedTransaction : t
  );
  
  saveTransactions(newTransactions);
  
  // Recalculate balances
  const balances = getBalances();
  const result = recalculateBalances({ id: updatedTransaction.event_id } as Event, balances);
  
  if (result.success) {
    return {
      success: true,
      message: "Transaktion erfolgreich aktualisiert.",
      updatedBalances: result.updatedBalances
    };
  }
  
  return { success: false, message: "Fehler beim Neuberechnen der Salden." };
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

  // Reset all balances and denominations to zero first
  for (let i = 0; i < updatedRegisters.length; i++) {
    updatedRegisters[i] = { 
      ...updatedRegisters[i], 
      balance: 0,
      denominations: [] 
    };
  }
  
  // Helper function to update register denominations
  const updateRegisterDenominations = (
    register: CashRegisterBalance,
    transactionDenominations: Denomination[],
    isAddition: boolean
  ) => {
    // Create a map of existing denominations
    const denominationMap = new Map<number, Denomination>();
    (register.denominations || []).forEach(d => denominationMap.set(d.value, { ...d }));
    
    // Update denominations
    transactionDenominations.forEach(d => {
      const existing = denominationMap.get(d.value);
      if (existing) {
        const newCount = isAddition
          ? existing.count + d.count
          : Math.max(0, existing.count - d.count);
        
        if (newCount > 0) {
          denominationMap.set(d.value, {
            value: d.value,
            count: newCount
          });
        } else {
          denominationMap.delete(d.value);
        }
      } else if (isAddition) {
        denominationMap.set(d.value, { ...d });
      }
    });
    
    // Convert map back to array
    return Array.from(denominationMap.values());
  };
  
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
          const register = updatedRegisters[registerIndex];
          updatedRegisters[registerIndex].balance += t.amount;
          
          // Update denominations if available
          if (t.denominations && t.denominations.length > 0) {
            updatedRegisters[registerIndex].denominations = updateRegisterDenominations(
              register,
              t.denominations,
              true // Add denominations
            );
          }
        }
      } else { // withdrawal
        // Find source register by name
        const sourceRegisterIndex = updatedRegisters.findIndex(
          r => r.name === t.source
        );
        
        if (sourceRegisterIndex >= 0) {
          const register = updatedRegisters[sourceRegisterIndex];
          updatedRegisters[sourceRegisterIndex].balance -= t.amount;
          
          // Update denominations if available
          if (t.denominations && t.denominations.length > 0) {
            updatedRegisters[sourceRegisterIndex].denominations = updateRegisterDenominations(
              register,
              t.denominations,
              false // Subtract denominations
            );
          }
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
            const register = updatedRegisters[targetRegisterIndex];
            updatedRegisters[targetRegisterIndex].balance += t.amount;
            
            // Update denominations if available
            if (t.denominations && t.denominations.length > 0) {
              updatedRegisters[targetRegisterIndex].denominations = updateRegisterDenominations(
                register,
                t.denominations,
                true // Add denominations
              );
            }
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
