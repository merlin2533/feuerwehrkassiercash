
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, RefreshCw, Settings } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import BalanceDisplay from "./BalanceDisplay";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";
import TransactionExcel from "./TransactionExcel";
import RegisterManager from "./RegisterManager";
import type { Event } from "./EventSelector";
import type { Transaction } from "./TransactionList";
import type { Denomination } from "@/types/models";
import { 
  saveTransactions, 
  getTransactions, 
  saveBalances, 
  getBalances, 
  DEFAULT_REGISTERS,
  getCustomRegisters,
  saveCustomRegisters,
  resetEvent,
  type LocalBalance,
  type CashRegisterBalance
} from "@/utils/localStorage";
import {
  processDeposit,
  processWithdrawal,
  recalculateBalances,
  deleteTransaction,
  updateTransaction
} from "@/utils/transactionUtils";

const CashRegister = ({ currentEvent }: { currentEvent: Event }) => {
  const [registers, setRegisters] = useState<CashRegisterBalance[]>([]);
  const [bankBalance, setBankBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentEvent) {
      fetchBalances();
      fetchTransactions();
    }
  }, [currentEvent]);

  const fetchBalances = () => {
    const balances = getBalances();
    const currentBalance = balances.find(b => b.event_id === currentEvent.id);
    
    // Get custom registers or use defaults
    const customRegisters = getCustomRegisters();
    const baseRegisters = customRegisters.length > 0 ? customRegisters : DEFAULT_REGISTERS;
    
    if (currentBalance) {
      // Make sure our current balance includes all registers (including newly added ones)
      const existingRegisterIds = currentBalance.registers.map(r => r.id);
      const newRegisters = baseRegisters.filter(r => !existingRegisterIds.includes(r.id));
      
      if (newRegisters.length > 0) {
        // We need to add the new registers to the current balance
        const updatedRegisters = [...currentBalance.registers, ...newRegisters];
        const updatedBalances = balances.map(b => 
          b.event_id === currentEvent.id 
            ? { ...b, registers: updatedRegisters }
            : b
        );
        saveBalances(updatedBalances);
        setRegisters(updatedRegisters);
      } else {
        setRegisters(currentBalance.registers);
      }
      
      setBankBalance(currentBalance.bank_balance);
    } else {
      // Initialize balances if they don't exist
      const newBalance: LocalBalance = {
        event_id: currentEvent.id,
        registers: [...baseRegisters],
        bank_balance: 0
      };
      const newBalances = [...balances, newBalance];
      saveBalances(newBalances);
      setRegisters(newBalance.registers);
      setBankBalance(0);
    }
  };

  const fetchTransactions = () => {
    const allTransactions = getTransactions();
    const eventTransactions = allTransactions.filter(t => t.event_id === currentEvent.id);
    setTransactions(eventTransactions);
  };

  const handleDeposit = (
    amount: number, 
    sourceRegisterId: string, 
    comment: string, 
    denominations?: Denomination[]
  ) => {
    if (amount <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    if (!sourceRegisterId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Kasse aus.",
        variant: "destructive",
      });
      return;
    }

    const result = processDeposit(
      currentEvent,
      amount,
      sourceRegisterId,
      comment,
      registers,
      denominations
    );

    if (result.success) {
      fetchBalances();
      fetchTransactions();
      toast({
        title: "Einzahlung erfolgt",
        description: result.message,
      });
    } else {
      toast({
        title: "Fehler",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleWithdrawal = (
    amount: number, 
    sourceRegisterId: string, 
    targetRegisterId: string | null, 
    toBank: boolean, 
    comment: string,
    denominations?: Denomination[]
  ) => {
    if (amount <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    if (!sourceRegisterId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Kasse aus.",
        variant: "destructive",
      });
      return;
    }

    // For transfer between registers
    if (!toBank && sourceRegisterId === targetRegisterId) {
      toast({
        title: "Fehler",
        description: "Quell- und Zielkasse können nicht identisch sein.",
        variant: "destructive",
      });
      return;
    }
    
    if (!toBank && !targetRegisterId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Zielkasse aus.",
        variant: "destructive",
      });
      return;
    }

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
      fetchBalances();
      fetchTransactions();
      toast({
        title: "Abhebung erfolgt",
        description: result.message,
      });
    } else {
      toast({
        title: "Fehler",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleImportTransactions = (importedTransactions: Transaction[]) => {
    const allTransactions = getTransactions();
    const newTransactions = [
      ...allTransactions,
      ...importedTransactions.map(t => ({
        ...t,
        event_id: currentEvent.id
      }))
    ];
    
    saveTransactions(newTransactions);
    
    // Recalculate balances
    const balances = getBalances();
    const result = recalculateBalances(currentEvent, balances);
    
    if (result.success) {
      fetchTransactions();
      fetchBalances();
      toast({
        title: "Import erfolgreich",
        description: `${importedTransactions.length} Transaktionen wurden importiert.`,
      });
    } else {
      toast({
        title: "Fehler beim Import",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateCustomRegisters = (updatedRegisters: CashRegisterBalance[]) => {
    saveCustomRegisters(updatedRegisters);
    
    // Update the event's registers as well
    const balances = getBalances();
    const currentBalance = balances.find(b => b.event_id === currentEvent.id);
    
    if (currentBalance) {
      // Preserve balances for existing registers
      const mergedRegisters = updatedRegisters.map(newReg => {
        const existingReg = currentBalance.registers.find(r => r.id === newReg.id);
        return existingReg ? existingReg : newReg;
      });
      
      const newBalances = balances.map(b => 
        b.event_id === currentEvent.id 
          ? { ...b, registers: mergedRegisters }
          : b
      );
      
      saveBalances(newBalances);
      setRegisters(mergedRegisters);
    }
  };

  const handleResetEvent = () => {
    if (resetEvent(currentEvent.id)) {
      fetchBalances();
      fetchTransactions();
      setIsResetDialogOpen(false);
      toast({
        title: "Veranstaltung zurückgesetzt",
        description: "Alle Transaktionen und Salden wurden gelöscht.",
      });
    } else {
      toast({
        title: "Fehler",
        description: "Fehler beim Zurücksetzen der Veranstaltung.",
        variant: "destructive",
      });
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    const result = updateTransaction(
      editingTransaction!,
      updatedTransaction
    );
    
    if (result.success) {
      fetchBalances();
      fetchTransactions();
      setEditingTransaction(null);
      toast({
        title: "Transaktion aktualisiert",
        description: result.message,
      });
    } else {
      toast({
        title: "Fehler",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const result = deleteTransaction(currentEvent.id, transactionId);
    
    if (result.success) {
      fetchBalances();
      fetchTransactions();
      toast({
        title: "Transaktion gelöscht",
        description: result.message,
      });
    } else {
      toast({
        title: "Fehler",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    const printContent = `
      Kassenbericht - ${currentEvent.name}
      Datum: ${new Date().toLocaleString()}
      
      Kassenbestände:
      ${registers.map(r => `${r.name}: ${r.balance.toFixed(2)}€`).join('\n')}
      Kassenstand (Bank): ${bankBalance.toFixed(2)}€
      
      Transaktionen:
      ${transactions
        .map(
          (t) => {
            let transactionText = `${new Date(t.created_at).toLocaleString()} - ${
              t.type === "deposit" ? "Einzahlung" : "Abhebung"
            } (${t.target}): ${
              t.type === "deposit" ? "+" : "-"
            }${t.amount.toFixed(2)}€ ${t.comment ? `- ${t.comment}` : ""}`;
            
            if (t.denominations && t.denominations.length > 0) {
              transactionText += `\nStückelung: ${t.denominations.map(
                d => `${d.count}x ${d.value >= 1 ? `${d.value}€` : `${d.value * 100}¢`}`
              ).join(", ")}`;
            }
            
            return transactionText;
          }
        )
        .join("\n\n")}
    `;

    const printWindow = window.open("", "", "height=600,width=800");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Kassenbericht - ${currentEvent.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { margin-bottom: 20px; }
              .balance { margin: 10px 0; font-size: 18px; }
              .transactions { margin-top: 20px; }
              .transaction { margin: 15px 0; }
              .denomination { margin-top: 5px; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <h1>Kassenbericht - ${currentEvent.name}</h1>
            <div>
              <h2>Kassenbestände:</h2>
              ${registers.map(
                (r) => `<div class="balance">${r.name}: ${r.balance.toFixed(2)}€</div>`
              ).join("")}
              <div class="balance">Kassenstand (Bank): ${bankBalance.toFixed(2)}€</div>
            </div>
            <div class="transactions">
              <h2>Transaktionen:</h2>
              ${transactions
                .map(
                  (t) => `
                  <div class="transaction">
                    ${new Date(t.created_at).toLocaleString()} - 
                    ${t.type === "deposit" ? "Einzahlung" : "Abhebung"}
                    (${t.target}): 
                    ${t.type === "deposit" ? "+" : "-"}${t.amount.toFixed(2)}€
                    ${t.comment ? `- ${t.comment}` : ""}
                    ${t.denominations && t.denominations.length > 0 
                      ? `<div class="denomination">Stückelung: ${t.denominations.map(
                          d => `${d.count}x ${d.value >= 1 ? `${d.value}€` : `${d.value * 100}¢`}`
                        ).join(", ")}</div>` 
                      : ""
                    }
                  </div>
                `
                )
                .join("")}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <BalanceDisplay registers={registers} bankBalance={bankBalance} />
        <div className="flex gap-2 flex-wrap">
          <TransactionExcel 
            transactions={transactions} 
            onImport={handleImportTransactions} 
          />
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Drucken
          </Button>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Einstellungen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Einstellungen</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="registers">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="registers">Kassen verwalten</TabsTrigger>
                  <TabsTrigger value="reset">Veranstaltung zurücksetzen</TabsTrigger>
                </TabsList>
                <TabsContent value="registers">
                  <RegisterManager 
                    registers={getCustomRegisters().length ? getCustomRegisters() : DEFAULT_REGISTERS} 
                    onUpdateRegisters={handleUpdateCustomRegisters} 
                  />
                </TabsContent>
                <TabsContent value="reset">
                  <div className="p-4 bg-white rounded-lg space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">Veranstaltung zurücksetzen</h2>
                    <p className="text-red-500">
                      Achtung: Alle Transaktionen und Salden dieser Veranstaltung werden unwiderruflich gelöscht.
                    </p>
                    <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="mt-4">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Veranstaltung zurücksetzen
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Veranstaltung wirklich zurücksetzen?</DialogTitle>
                        </DialogHeader>
                        <p className="py-4">
                          Alle Transaktionen und Salden für "{currentEvent.name}" werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                        </p>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsResetDialogOpen(false)}
                          >
                            Abbrechen
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleResetEvent}
                          >
                            Ja, zurücksetzen
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TransactionForm 
        registers={registers}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdrawal}
        editingTransaction={editingTransaction}
        onCancelEdit={() => setEditingTransaction(null)}
        onUpdateTransaction={handleUpdateTransaction}
      />

      <TransactionList 
        transactions={transactions} 
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
      />
    </div>
  );
};

export default CashRegister;
