import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BillCalculator from "./BillCalculator";
import TransactionList from "./TransactionList";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const CashRegister = () => {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(0);
  const [comment, setComment] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const { toast } = useToast();

  const handleTransaction = (type: "deposit" | "withdrawal") => {
    if (amount <= 0) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    if (type === "withdrawal" && amount > balance) {
      toast({
        title: "Fehler",
        description: "Nicht genügend Geld in der Kasse.",
        variant: "destructive",
      });
      return;
    }

    const newTransaction = {
      id: Date.now(),
      amount,
      type,
      comment: comment || (type === "deposit" ? "Einzahlung" : "Abhebung"),
      timestamp: new Date(),
    };

    setTransactions([newTransaction, ...transactions]);
    setBalance(type === "deposit" ? balance + amount : balance - amount);
    setAmount(0);
    setComment("");

    toast({
      title: type === "deposit" ? "Einzahlung erfolgt" : "Abhebung erfolgt",
      description: `${amount.toFixed(2)}€ wurden ${
        type === "deposit" ? "eingezahlt" : "abgehoben"
      }.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Kassenstand</h2>
        <p className="text-4xl font-bold text-primary">{balance.toFixed(2)}€</p>
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
              Abheben
            </Button>
          </div>
        </div>
      </div>

      <TransactionList transactions={transactions} />
    </div>
  );
};

export default CashRegister;