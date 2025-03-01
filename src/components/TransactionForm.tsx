
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import RegisterSelector from "./RegisterSelector";
import BillCalculator from "./BillCalculator";
import type { CashRegisterBalance } from "@/utils/localStorage";

interface TransactionFormProps {
  registers: CashRegisterBalance[];
  onDeposit: (amount: number, sourceRegister: string, comment: string) => void;
  onWithdraw: (amount: number, sourceRegister: string, targetRegister: string | null, toBank: boolean, comment: string) => void;
}

const TransactionForm = ({
  registers,
  onDeposit,
  onWithdraw
}: TransactionFormProps) => {
  const [amount, setAmount] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedSourceRegister, setSelectedSourceRegister] = useState(registers.length > 0 ? registers[0].id : "");
  const [selectedTargetRegister, setSelectedTargetRegister] = useState("");

  const handleDeposit = () => {
    onDeposit(amount, selectedSourceRegister, comment);
    resetForm();
  };

  const handleWithdrawal = (toBank = false) => {
    onWithdraw(
      amount, 
      selectedSourceRegister, 
      toBank ? null : selectedTargetRegister, 
      toBank, 
      comment
    );
    resetForm();
  };

  const handleTransferToRegister = () => {
    if (selectedSourceRegister === selectedTargetRegister) {
      return; // This validation is also in the parent, but let's keep it here too
    }
    
    if (!selectedTargetRegister) {
      return; // This validation is also in the parent, but let's keep it here too
    }
    
    handleWithdrawal(false);
  };

  const resetForm = () => {
    setAmount(0);
    setComment("");
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Transaktion</h2>
      <div className="space-y-4">
        <BillCalculator onTotalChange={setAmount} />
        
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
          <RegisterSelector 
            registers={registers}
            selectedRegister={selectedSourceRegister}
            onChange={setSelectedSourceRegister}
            label="Quell-Kasse"
          />
          
          <RegisterSelector 
            registers={registers}
            selectedRegister={selectedTargetRegister}
            onChange={setSelectedTargetRegister}
            label="Ziel-Kasse (für Transfer)"
          />
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
  );
};

export default TransactionForm;
