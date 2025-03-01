import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import BillCalculator from "./BillCalculator";
import TransactionList from "./TransactionList";
import TransactionExcel from "./TransactionExcel";
import { ArrowUpCircle, ArrowDownCircle, Printer } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
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

const CashRegister = ({ currentEvent }: { currentEvent: Event }) => {
  const [registers, setRegisters] = useState<CashRegisterBalance[]>([]);
  const [bankBalance, setBankBalance] = useState(0);
  const [amount, setAmount] = useState(0);
  const [comment, setComment] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedSourceRegister, setSelectedSourceRegister] = useState("");
  const [selectedTargetRegister, setSelectedTargetRegister] = useState("");
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
    
    // Set initial selected register
    if (registers.length > 0 && !selectedSourceRegister) {
      setSelectedSourceRegister(registers[0].id);
    }
  };

  const fetchTransactions = () => {
    const allTransactions = getTransactions();
    const eventTransactions = allTransactions.filter(t => t.event_id === currentEvent.id);
    setTransactions(eventTransactions);
  };

  const handleDeposit = () => {
    if (amount <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSourceRegister) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Kasse aus.",
        variant: "destructive",
      });
      return;
    }

    // Create new transaction
    const newTransaction = {
      id: crypto.randomUUID(),
      event_id: currentEvent.id,
      amount,
      type: "deposit" as const,
      target: registers.find(r => r.id === selectedSourceRegister)?.name || "Unbekannt",
      comment: comment || "Einzahlung",
      created_at: new Date().toISOString()
    };

    // Update transactions
    const allTransactions = getTransactions();
    const newTransactions = [...allTransactions, newTransaction];
    saveTransactions(newTransactions);

    // Update balances
    const balances = getBalances();
    const currentBalance = balances.find(b => b.event_id === currentEvent.id);
    
    if (currentBalance) {
      const updatedRegisters = currentBalance.registers.map(register => {
        if (register.id === selectedSourceRegister) {
          return { ...register, balance: register.balance + amount };
        }
        return register;
      });
      
      const newBalances = balances.map(b => 
        b.event_id === currentEvent.id 
          ? { ...b, registers: updatedRegisters }
          : b
      );
      
      saveBalances(newBalances);
    }

    // Update state
    setAmount(0);
    setComment("");
    fetchBalances();
    fetchTransactions();

    toast({
      title: "Einzahlung erfolgt",
      description: `${amount.toFixed(2)}€ wurden eingezahlt.`,
    });
  };

  const handleWithdrawal = (toBank = false) => {
    if (amount <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSourceRegister) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Kasse aus.",
        variant: "destructive",
      });
      return;
    }

    const sourceRegister = registers.find(r => r.id === selectedSourceRegister);
    
    if (!sourceRegister) {
      toast({
        title: "Fehler",
        description: "Kasse nicht gefunden.",
        variant: "destructive",
      });
      return;
    }

    if (amount > sourceRegister.balance) {
      toast({
        title: "Fehler",
        description: "Nicht genügend Geld in der Kasse.",
        variant: "destructive",
      });
      return;
    }

    // Define target for transfer
    let target = toBank ? "Bank" : "Bar Entnahme";
    let targetRegisterId = null;
    
    if (!toBank && selectedTargetRegister) {
      const targetRegister = registers.find(r => r.id === selectedTargetRegister);
      target = targetRegister?.name || "Unbekannt";
      targetRegisterId = selectedTargetRegister;
    }

    // Create new transaction
    const newTransaction = {
      id: crypto.randomUUID(),
      event_id: currentEvent.id,
      amount,
      type: "withdrawal" as const,
      source: sourceRegister?.name,
      target,
      comment: comment || `Abhebung (${target})`,
      created_at: new Date().toISOString()
    };

    // Update transactions
    const allTransactions = getTransactions();
    const newTransactions = [...allTransactions, newTransaction];
    saveTransactions(newTransactions);

    // Update balances
    const balances = getBalances();
    const currentBalance = balances.find(b => b.event_id === currentEvent.id);
    
    if (currentBalance) {
      // Update source register
      let updatedRegisters = currentBalance.registers.map(register => {
        if (register.id === selectedSourceRegister) {
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
        b.event_id === currentEvent.id 
          ? { ...b, registers: updatedRegisters, bank_balance: newBankBalance }
          : b
      );
      
      saveBalances(newBalances);
    }

    // Update state
    setAmount(0);
    setComment("");
    fetchBalances();
    fetchTransactions();

    toast({
      title: "Abhebung erfolgt",
      description: `${amount.toFixed(2)}€ wurden von ${sourceRegister.name} ${toBank ? "zur Bank überwiesen" : targetRegisterId ? `zu ${target} transferiert` : "entnommen"}.`,
    });
  };

  const handleTransferToRegister = () => {
    if (selectedSourceRegister === selectedTargetRegister) {
      toast({
        title: "Fehler",
        description: "Quell- und Zielkasse können nicht identisch sein.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedTargetRegister) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Zielkasse aus.",
        variant: "destructive",
      });
      return;
    }
    
    handleWithdrawal(false);
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
    const balances = getBalances();
    const currentBalance = balances.find(b => b.event_id === currentEvent.id);
    
    if (currentBalance) {
      // Create a copy of registers to update
      const updatedRegisters = [...currentBalance.registers];
      let newBankBalance = currentBalance.bank_balance;
      
      // Reset all balances to zero first
      for (let i = 0; i < updatedRegisters.length; i++) {
        updatedRegisters[i] = { ...updatedRegisters[i], balance: 0 };
      }
      
      // Recalculate from all transactions
      newTransactions
        .filter(t => t.event_id === currentEvent.id)
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
            // Find source register
            const sourceRegisterIndex = updatedRegisters.findIndex(
              r => r.name === t.target.replace("von ", "")
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
      const newBalances = balances.map(b => 
        b.event_id === currentEvent.id 
          ? { ...b, registers: updatedRegisters, bank_balance: newBankBalance }
          : b
      );
      
      saveBalances(newBalances);
      fetchBalances();
    }

    toast({
      title: "Import erfolgreich",
      description: `${importedTransactions.length} Transaktionen wurden importiert.`,
    });
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

  // Calculate total balance
  const totalBalance = registers.reduce((sum, register) => sum + register.balance, 0) + bankBalance;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Kassenstand (Gesamt)</h2>
            <p className="text-4xl font-bold text-primary">{totalBalance.toFixed(2)}€</p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Kassenstand (Bar)</h2>
            <p className="text-4xl font-bold text-primary">
              {registers.reduce((sum, r) => sum + r.balance, 0).toFixed(2)}€
            </p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {registers.map((register) => (
          <div key={register.id} className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800">{register.name}</h3>
            <p className="text-2xl font-bold text-primary">{register.balance.toFixed(2)}€</p>
          </div>
        ))}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Quell-Kasse</label>
              <Select 
                value={selectedSourceRegister} 
                onValueChange={setSelectedSourceRegister}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kasse auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {registers.map((register) => (
                    <SelectItem key={register.id} value={register.id}>
                      {register.name} ({register.balance.toFixed(2)}€)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Ziel-Kasse (für Transfer)</label>
              <Select 
                value={selectedTargetRegister} 
                onValueChange={setSelectedTargetRegister}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ziel-Kasse auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {registers.map((register) => (
                    <SelectItem key={register.id} value={register.id}>
                      {register.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                onClick={handleDeposit}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Einzahlen
              </Button>
              <Button
                onClick={() => handleWithdrawal(false)}
                className="flex-1 bg-primary hover:bg-primary-dark"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Bar abheben
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleWithdrawal(true)}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Zur Bank
              </Button>
              <Button
                onClick={handleTransferToRegister}
                className="flex-1 bg-purple-500 hover:bg-purple-600"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Zu anderer Kasse
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TransactionList transactions={transactions} />
    </div>
  );
};

export default CashRegister;
