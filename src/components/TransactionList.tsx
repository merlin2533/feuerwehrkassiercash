
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export type Transaction = {
  id: string;
  event_id: string;
  amount: number;
  type: "deposit" | "withdrawal";
  target: string; // Changed from "cash" | "bank" to allow for multiple cash registers
  comment: string;
  created_at: string;
};

const TransactionList = ({ transactions }: { transactions: Transaction[] }) => {
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
              </div>
            </div>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
