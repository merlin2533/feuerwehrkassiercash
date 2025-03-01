
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import BalanceDisplay from "./BalanceDisplay";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";
import TransactionExcel from "./TransactionExcel";
import type { Event } from "./EventSelector";
import { 
  saveTransactions, 
  getTransactions, 
  saveBalances, 
  getBalances, 
  DEFAULT_REGISTERS,
  type LocalBalance,
  type CashRegisterBalance
} from "@/utils/localStorage";
import {
  processDeposit,
  processWithdrawal,
  recalculateBalances
} from "@/utils/transactionUtils";

const CashRegister = ({ currentEvent }: { currentEvent: Event }) => {
  const [registers, setRegisters] = useState<CashRegisterBalance[]>([]);
  const [bankBalance, setBankBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
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
    
    if (currentBalance) {
      setRegisters(currentBalance.registers);
      setBankBalance(currentBalance.bank_balance);
    } else {
      // Initialize balances if they don't exist
      const newBalance: LocalBalance = {
        event_id: currentEvent.id,
        registers: [...DEFAULT_REGISTERS],
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

  const handleDeposit = (amount: number, sourceRegisterId: string, comment: string) => {
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
      registers
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
    comment: string
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
      registers
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

  const handleImportTransactions = (importedTransactions: any[]) => {
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
          (t) =>
            `${new Date(t.created_at).toLocaleString()} - ${
              t.type === "deposit" ? "Einzahlung" : "Abhebung"
            } (${t.target}): ${
              t.type === "deposit" ? "+" : "-"
            }${t.amount.toFixed(2)}€ ${t.comment ? `- ${t.comment}` : ""}`
        )
        .join("\n")}
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
              .transaction { margin: 5px 0; }
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
      <div className="flex justify-between items-center">
        <BalanceDisplay registers={registers} bankBalance={bankBalance} />
        <div className="flex gap-2">
          <TransactionExcel 
            transactions={transactions} 
            onImport={handleImportTransactions} 
          />
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Drucken
          </Button>
        </div>
      </div>

      <TransactionForm 
        registers={registers}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdrawal}
      />

      <TransactionList transactions={transactions} />
    </div>
  );
};

export default CashRegister;
