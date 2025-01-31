import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BillCalculator from "./BillCalculator";
import TransactionList from "./TransactionList";
import TransactionExcel from "./TransactionExcel";
import { ArrowUpCircle, ArrowDownCircle, Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Event } from "./EventSelector";
import { saveTransactions, getTransactions, saveBalances, getBalances, type LocalBalance } from "@/utils/localStorage";

const CashRegister = ({ currentEvent }: { currentEvent: Event }) => {
  const [cashBalance, setCashBalance] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  const [amount, setAmount] = useState(0);
  const [comment, setComment] = useState("");
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
      setCashBalance(currentBalance.cash_balance);
      setBankBalance(currentBalance.bank_balance);
    } else {
      // Initialize balances if they don't exist
      const newBalances = [...balances, {
        event_id: currentEvent.id,
        cash_balance: 0,
        bank_balance: 0
      }];
      saveBalances(newBalances);
      setCashBalance(0);
      setBankBalance(0);
    }
  };

  const fetchTransactions = () => {
    const allTransactions = getTransactions();
    const eventTransactions = allTransactions.filter(t => t.event_id === currentEvent.id);
    setTransactions(eventTransactions);
  };

  const handleTransaction = (type: "deposit" | "withdrawal", target: "cash" | "bank" = "cash") => {
    if (amount <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    if (type === "withdrawal" && amount > cashBalance && target === "cash") {
      toast({
        title: "Fehler",
        description: "Nicht genügend Geld in der Kasse.",
        variant: "destructive",
      });
      return;
    }

    // Create new transaction
    const newTransaction = {
      id: crypto.randomUUID(),
      event_id: currentEvent.id,
      amount,
      type,
      target,
      comment: comment || (type === "deposit" ? "Einzahlung" : `Abhebung (${target === "bank" ? "Bank" : "Bar"})`),
      created_at: new Date().toISOString()
    };

    // Update transactions
    const allTransactions = getTransactions();
    const newTransactions = [...allTransactions, newTransaction];
    saveTransactions(newTransactions);

    // Update balances
    const balances = getBalances();
    const currentBalance = balances.find(b => b.event_id === currentEvent.id);
    const newCashBalance = target === "cash"
      ? type === "deposit" 
        ? (currentBalance?.cash_balance || 0) + amount 
        : (currentBalance?.cash_balance || 0) - amount
      : type === "withdrawal"
        ? (currentBalance?.cash_balance || 0) - amount
        : (currentBalance?.cash_balance || 0);

    const newBankBalance = target === "bank"
      ? (currentBalance?.bank_balance || 0) + amount
      : (currentBalance?.bank_balance || 0);

    const newBalances = balances.map(b => 
      b.event_id === currentEvent.id 
        ? { ...b, cash_balance: newCashBalance, bank_balance: newBankBalance }
        : b
    );

    if (!currentBalance) {
      newBalances.push({
        event_id: currentEvent.id,
        cash_balance: newCashBalance,
        bank_balance: newBankBalance
      });
    }

    saveBalances(newBalances);

    // Update state
    setAmount(0);
    setComment("");
    fetchBalances();
    fetchTransactions();

    toast({
      title: type === "deposit" ? "Einzahlung erfolgt" : "Abhebung erfolgt",
      description: `${amount.toFixed(2)}€ wurden ${
        type === "deposit" ? "eingezahlt" : `abgehoben (${target === "bank" ? "Bank" : "Bar"})`
      }.`,
    });
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
    fetchTransactions();
    
    // Recalculate balances
    let newCashBalance = 0;
    let newBankBalance = 0;
    
    newTransactions
      .filter(t => t.event_id === currentEvent.id)
      .forEach(t => {
        if (t.type === "deposit") {
          if (t.target === "cash") {
            newCashBalance += t.amount;
          } else {
            newBankBalance += t.amount;
          }
        } else {
          if (t.target === "cash") {
            newCashBalance -= t.amount;
          } else if (t.target === "bank") {
            newBankBalance += t.amount;
            newCashBalance -= t.amount;
          }
        }
      });

    const balances = getBalances();
    const newBalances = balances.map(b => 
      b.event_id === currentEvent.id 
        ? { ...b, cash_balance: newCashBalance, bank_balance: newBankBalance }
        : b
    );

    if (!balances.find(b => b.event_id === currentEvent.id)) {
      newBalances.push({
        event_id: currentEvent.id,
        cash_balance: newCashBalance,
        bank_balance: newBankBalance
      });
    }

    saveBalances(newBalances);
    fetchBalances();
  };

  const handlePrint = () => {
    const printContent = `
      Kassenbericht - ${currentEvent.name}
      Datum: ${new Date().toLocaleString()}
      
      Kassenstand (Bar): ${cashBalance.toFixed(2)}€
      Kassenstand (Bank): ${bankBalance.toFixed(2)}€
      
      Transaktionen:
      ${transactions
        .map(
          (t) =>
            `${new Date(t.created_at).toLocaleString()} - ${
              t.type === "deposit" ? "Einzahlung" : "Abhebung"
            } (${t.target === "bank" ? "Bank" : "Bar"}): ${
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
            <div class="balance">Kassenstand (Bar): ${cashBalance.toFixed(2)}€</div>
            <div class="balance">Kassenstand (Bank): ${bankBalance.toFixed(2)}€</div>
            <div class="transactions">
              <h2>Transaktionen:</h2>
              ${transactions
                .map(
                  (t) => `
                  <div class="transaction">
                    ${new Date(t.created_at).toLocaleString()} - 
                    ${t.type === "deposit" ? "Einzahlung" : "Abhebung"}
                    (${t.target === "bank" ? "Bank" : "Bar"}): 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Kassenstand (Bar)</h2>
            <p className="text-4xl font-bold text-primary">{cashBalance.toFixed(2)}€</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Kassenstand (Bank)</h2>
            <p className="text-4xl font-bold text-primary">{bankBalance.toFixed(2)}€</p>
          </div>
        </div>
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

      <BillCalculator onTotalChange={setAmount} />

      <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">Transaktion</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Betrag"
              className="text-lg"
            />
            <span className="text-lg">€</span>
          </div>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Kommentar (optional)"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleTransaction("deposit")}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Einzahlen
            </Button>
            <Button
              onClick={() => handleTransaction("withdrawal")}
              className="flex-1 bg-primary hover:bg-primary-dark"
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Bar abheben
            </Button>
            <Button
              onClick={() => handleTransaction("withdrawal", "bank")}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Zur Bank
            </Button>
          </div>
        </div>
      </div>

      <TransactionList transactions={transactions} />
    </div>
  );
};

export default CashRegister;
