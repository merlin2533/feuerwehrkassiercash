
import { ArrowUpCircle, ArrowDownCircle, Edit, Trash } from "lucide-react";
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

const TransactionList = ({ 
  transactions, 
  onEditTransaction, 
  onDeleteTransaction 
}: TransactionListProps) => {
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

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Transaktionen</h2>
      <div className="space-y-2">
        {transactions.map((transaction) => (
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
    </div>
  );
};

export default TransactionList;
