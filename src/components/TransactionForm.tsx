
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import RegisterSelector from "./RegisterSelector";
import BillCalculator from "./BillCalculator";
import type { CashRegisterBalance } from "@/utils/localStorage";
import type { Denomination } from "@/types/models";
import type { Transaction } from "./TransactionList";

interface TransactionFormProps {
  registers: CashRegisterBalance[];
  onDeposit: (amount: number, sourceRegister: string, comment: string, denominations?: Denomination[]) => void;
  onWithdraw: (amount: number, sourceRegister: string, targetRegister: string | null, toBank: boolean, comment: string, denominations?: Denomination[]) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
}

const TransactionForm = ({
  registers,
  onDeposit,
  onWithdraw,
  editingTransaction = null,
  onCancelEdit,
  onUpdateTransaction
}: TransactionFormProps) => {
  const [amount, setAmount] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedSourceRegister, setSelectedSourceRegister] = useState(registers.length > 0 ? registers[0].id : "");
  const [selectedTargetRegister, setSelectedTargetRegister] = useState("");
  const [denominations, setDenominations] = useState<Denomination[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Set up form when editing an existing transaction
  useEffect(() => {
    if (editingTransaction) {
      setAmount(editingTransaction.amount);
      setComment(editingTransaction.comment || "");
      setIsEditing(true);

      // Find register IDs based on names
      if (editingTransaction.type === "withdrawal" && editingTransaction.source) {
        const sourceRegister = registers.find(r => r.name === editingTransaction.source);
        if (sourceRegister) {
          setSelectedSourceRegister(sourceRegister.id);
        }
        
        // If it's a transfer to another register (not bank or bar removal)
        if (editingTransaction.target !== "Bank" && editingTransaction.target !== "Bar Entnahme") {
          const targetRegister = registers.find(r => r.name === editingTransaction.target);
          if (targetRegister) {
            setSelectedTargetRegister(targetRegister.id);
          }
        }
      } else if (editingTransaction.type === "deposit") {
        const targetRegister = registers.find(r => r.name === editingTransaction.target);
        if (targetRegister) {
          setSelectedSourceRegister(targetRegister.id);
        }
      }

      // Set denominations if available
      if (editingTransaction.denominations) {
        setDenominations(editingTransaction.denominations);
      }
    } else {
      resetForm();
      setIsEditing(false);
    }
  }, [editingTransaction, registers]);

  const handleDeposit = () => {
    onDeposit(amount, selectedSourceRegister, comment, denominations.length > 0 ? denominations : undefined);
    resetForm();
  };

  const handleWithdrawal = (toBank = false) => {
    onWithdraw(
      amount, 
      selectedSourceRegister, 
      toBank ? null : selectedTargetRegister, 
      toBank, 
      comment,
      denominations.length > 0 ? denominations : undefined
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

  const handleUpdateTransaction = () => {
    if (!editingTransaction || !onUpdateTransaction) return;
    
    const updatedTransaction: Transaction = {
      ...editingTransaction,
      amount,
      comment,
      denominations: denominations.length > 0 ? denominations : undefined
    };
    
    onUpdateTransaction(updatedTransaction);
    resetForm();
  };

  const resetForm = () => {
    setAmount(0);
    setComment("");
    setDenominations([]);
    if (onCancelEdit) onCancelEdit();
  };

  const handleDenominationsChange = (newDenominations: Denomination[]) => {
    setDenominations(newDenominations);
  };

  // Convert denominations array to object for BillCalculator
  const getDenominationCounts = () => {
    if (!denominations || denominations.length === 0) return {};
    return denominations.reduce((acc, curr) => ({
      ...acc,
      [curr.value]: curr.count
    }), {});
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">
        {isEditing ? "Transaktion bearbeiten" : "Transaktion"}
      </h2>
      <div className="space-y-4">
        <BillCalculator 
          onTotalChange={setAmount} 
          onDenominationsChange={handleDenominationsChange}
          initialDenominations={getDenominationCounts()}
        />
        
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
          
          {!isEditing && (
            <RegisterSelector 
              registers={registers}
              selectedRegister={selectedTargetRegister}
              onChange={setSelectedTargetRegister}
              label="Ziel-Kasse (für Transfer)"
            />
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateTransaction}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                Transaktion aktualisieren
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
