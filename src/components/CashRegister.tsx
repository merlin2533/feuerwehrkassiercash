
import { useState, useEffect } from "react";
import BalanceDisplay from "./BalanceDisplay";
import TransactionList from "./TransactionList";
import TransactionForm from "./TransactionForm";
import RegisterSelector from "./RegisterSelector";
import RegisterManager from "./RegisterManager";
import TransactionExcel from "./TransactionExcel";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { getTransactions, getBalances, saveBalances, DEFAULT_REGISTERS, resetEvent } from "@/utils/localStorage";
import { processDeposit, processWithdrawal, deleteTransaction, updateTransaction } from "@/utils/transactionUtils";
import type { Event } from "./EventSelector";
import type { Transaction } from "./TransactionList";
import { useToast } from "@/components/ui/use-toast";
import { ChevronDown, ChevronUp, Settings, Upload, Download, RefreshCcw } from "lucide-react";

interface CashRegisterProps {
  currentEvent: Event;
}

const CashRegister = ({ currentEvent }: CashRegisterProps) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [registers, setRegisters] = useState(DEFAULT_REGISTERS);
  const [bankBalance, setBankBalance] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isTransactionFormCollapsed, setIsTransactionFormCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load data when event changes
  useEffect(() => {
    loadData();
  }, [currentEvent]);

  const loadData = () => {
    // Get transactions for current event
    const allTransactions = getTransactions();
    const eventTransactions = allTransactions.filter(t => t.event_id === currentEvent.id);
    setTransactions(eventTransactions);

    // Get or initialize balances for current event
    const balances = getBalances();
    const currentBalance = balances.find(b => b.event_id === currentEvent.id);

    if (currentBalance) {
      setRegisters(currentBalance.registers);
      setBankBalance(currentBalance.bank_balance);
    } else {
      // Initialize new balance record for this event
      const newBalance = {
        event_id: currentEvent.id,
        registers: DEFAULT_REGISTERS,
        bank_balance: 0
      };
      saveBalances([...balances, newBalance]);
      setRegisters(DEFAULT_REGISTERS);
      setBankBalance(0);
    }
  };

  // Handle deposit
  const handleDeposit = (amount: number, registerId: string, comment: string, denominations?: any[]) => {
    const result = processDeposit(
      currentEvent,
      amount,
      registerId,
      comment,
      registers,
      denominations
    );

    if (result.success) {
      toast({
        title: "Einzahlung erfolgreich",
        description: result.message,
      });

      // Update local state
      loadData();
    } else {
      toast({
        title: "Fehler",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  // Handle withdrawal
  const handleWithdrawal = (
    amount: number,
    sourceRegisterId: string,
    targetRegisterId: string | null,
    toBank: boolean,
    comment: string,
    denominations?: any[]
  ) => {
    const result = processWithdrawal(
      currentEvent,
      amount,
      sourceRegisterId,
      targetRegisterId,
      toBank,
      comment,
      registers,
      denominations
    );

    if (result.success) {
      toast({
        title: "Auszahlung erfolgreich",
        description: result.message,
      });

      // Update local state
      loadData();
    } else {
      toast({
        title: "Fehler",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionFormCollapsed(false); // Expand the form when editing
  };

  // Handle update transaction
  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    const result = updateTransaction(editingTransaction!, updatedTransaction);

    if (result.success) {
      toast({
        title: "Transaktion aktualisiert",
        description: result.message,
      });

      setEditingTransaction(null);
      loadData();
    } else {
      toast({
        title: "Fehler",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = (transactionId: string) => {
    const confirmDelete = window.confirm("Möchten Sie diese Transaktion wirklich löschen?");
    
    if (confirmDelete) {
      const result = deleteTransaction(currentEvent.id, transactionId);

      if (result.success) {
        toast({
          title: "Transaktion gelöscht",
          description: result.message,
        });

        loadData();
      } else {
        toast({
          title: "Fehler",
          description: result.message,
          variant: "destructive",
        });
      }
    }
  };

  // Handle reset event
  const handleResetEvent = () => {
    const confirmReset = window.confirm(
      "Möchten Sie wirklich alle Transaktionen und Kassenstände für diese Veranstaltung zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden."
    );
    
    if (confirmReset) {
      const success = resetEvent(currentEvent.id);
      
      if (success) {
        toast({
          title: "Veranstaltung zurückgesetzt",
          description: "Alle Transaktionen und Kassenstände wurden zurückgesetzt.",
        });
        
        loadData();
      } else {
        toast({
          title: "Fehler",
          description: "Beim Zurücksetzen der Veranstaltung ist ein Fehler aufgetreten.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle register update
  const handleRegisterUpdate = (updatedRegisters: any[]) => {
    // Update balances with new registers
    const balances = getBalances();
    const updatedBalances = balances.map(b => {
      if (b.event_id === currentEvent.id) {
        return {
          ...b,
          registers: updatedRegisters
        };
      }
      return b;
    });
    
    saveBalances(updatedBalances);
    setRegisters(updatedRegisters);
    
    toast({
      title: "Kassen aktualisiert",
      description: "Die Kassenliste wurde erfolgreich aktualisiert.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">
          {currentEvent.name}
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="w-4 h-4 mr-1" />
            Einstellungen
          </Button>
          <TransactionExcel 
            transactions={transactions} 
            registers={registers}
            buttonIcon={<Download className="w-4 h-4 mr-1" />} 
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleResetEvent}
          >
            <RefreshCcw className="w-4 h-4 mr-1" />
            Zurücksetzen
          </Button>
        </div>
      </div>

      <BalanceDisplay registers={registers} bankBalance={bankBalance} />

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setIsTransactionFormCollapsed(prev => !prev)}
        >
          <h2 className="text-2xl font-bold text-gray-800">Buchung</h2>
          {isTransactionFormCollapsed ? (
            <ChevronDown className="h-6 w-6 text-gray-500" />
          ) : (
            <ChevronUp className="h-6 w-6 text-gray-500" />
          )}
        </div>
        
        {!isTransactionFormCollapsed && (
          <TransactionForm
            registers={registers}
            onDeposit={handleDeposit}
            onWithdrawal={handleWithdrawal}
            editingTransaction={editingTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onCancelEdit={() => setEditingTransaction(null)}
          />
        )}
      </div>

      <TransactionList 
        transactions={transactions}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
      />

      {isSettingsOpen && (
        <RegisterManager
          registers={registers}
          onUpdateRegisters={handleRegisterUpdate}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default CashRegister;
