
import { useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, Edit, Trash, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import type { Denomination } from "@/types/models";

export type Transaction = {
  id: string;
  event_id: string;
  amount: number;
  type: "deposit" | "withdrawal";
  target: string; 
  source?: string;
  comment: string;
  created_at: string;
  denominations?: Denomination[];
};

interface TransactionListProps {
  transactions: Transaction[];
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

type SortField = "date" | "amount" | "comment" | "target";
type SortDirection = "asc" | "desc";

const TransactionList = ({ 
  transactions, 
  onEditTransaction, 
  onDeleteTransaction 
}: TransactionListProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Helper function to get color based on transaction target
  const getTargetColor = (target: string) => {
    switch (target) {
      case "Bank":
        return "text-blue-500";
      case "Bar 1":
      case "Bar 2":
      case "Bar 3":
      case "Bar 4":
        return "text-green-600";
      case "Karten":
        return "text-purple-500";
      case "Bierstand":
        return "text-amber-600";
      case "Essenstand":
        return "text-orange-500";
      case "Alkoholfrei":
        return "text-cyan-500";
      case "Gardarobe":
        return "text-indigo-500";
      case "Kassier":
        return "text-rose-500";
      default:
        return "text-primary";
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case "date":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "comment":
        comparison = a.comment.localeCompare(b.comment);
        break;
      case "target":
        comparison = a.target.localeCompare(b.target);
        break;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsCollapsed(prev => !prev)}
      >
        <h2 className="text-2xl font-bold text-gray-800">Transaktionen</h2>
        {isCollapsed ? (
          <ChevronDown className="h-6 w-6 text-gray-500" />
        ) : (
          <ChevronUp className="h-6 w-6 text-gray-500" />
        )}
      </div>
      
      {!isCollapsed && (
        <>
          <div className="flex items-center gap-4 mb-3 text-sm font-medium text-gray-600 border-b pb-2">
            <div 
              className="flex items-center gap-1 cursor-pointer" 
              onClick={() => toggleSort("date")}
            >
              Datum
              <ArrowUpDown className="h-4 w-4" />
              {sortField === "date" && (
                sortDirection === "asc" ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            <div 
              className="flex items-center gap-1 cursor-pointer" 
              onClick={() => toggleSort("comment")}
            >
              Beschreibung
              <ArrowUpDown className="h-4 w-4" />
              {sortField === "comment" && (
                sortDirection === "asc" ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            <div 
              className="flex items-center gap-1 cursor-pointer ml-auto" 
              onClick={() => toggleSort("target")}
            >
              Ziel
              <ArrowUpDown className="h-4 w-4" />
              {sortField === "target" && (
                sortDirection === "asc" ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            <div 
              className="flex items-center gap-1 cursor-pointer" 
              onClick={() => toggleSort("amount")}
            >
              Betrag
              <ArrowUpDown className="h-4 w-4" />
              {sortField === "amount" && (
                sortDirection === "asc" ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            {sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {transaction.type === "deposit" ? (
                    <ArrowUpCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <ArrowDownCircle className={`w-6 h-6 ${getTargetColor(transaction.target)}`} />
                  )}
                  <div>
                    <p className="font-medium">{transaction.comment}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                    {transaction.source && transaction.type === "withdrawal" && (
                      <p className="text-xs text-gray-600">
                        Von: <span className={getTargetColor(transaction.source)}>{transaction.source}</span> → 
                        Nach: <span className={getTargetColor(transaction.target)}>{transaction.target}</span>
                      </p>
                    )}
                    {transaction.type === "deposit" && (
                      <p className="text-xs text-gray-600">
                        Eingezahlt in: <span className={getTargetColor(transaction.target)}>{transaction.target}</span>
                      </p>
                    )}
                    {transaction.denominations && transaction.denominations.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        <span className="font-medium">Stückelung: </span>
                        {transaction.denominations.map((d, index) => (
                          <span key={d.value}>
                            {d.count}x {d.value >= 1 ? `${d.value}€` : `${d.value * 100}¢`}
                            {index < transaction.denominations!.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      transaction.type === "deposit"
                        ? "text-green-500"
                        : getTargetColor(transaction.target)
                    }`}
                  >
                    {transaction.type === "deposit" ? "+" : "-"}
                    {transaction.amount.toFixed(2)}€
                  </span>
                  
                  {(onEditTransaction || onDeleteTransaction) && (
                    <div className="flex gap-1">
                      {onEditTransaction && (
                        <button 
                          onClick={() => onEditTransaction(transaction)}
                          className="p-1 text-gray-500 hover:text-blue-500"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteTransaction && (
                        <button 
                          onClick={() => onDeleteTransaction(transaction.id)}
                          className="p-1 text-gray-500 hover:text-red-500"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionList;
