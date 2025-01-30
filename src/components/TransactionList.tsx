import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

type Transaction = {
  id: number;
  amount: number;
  type: "deposit" | "withdrawal";
  target: "cash" | "bank";
  comment: string;
  created_at: string; // Changed from timestamp to string since that's what Supabase returns
};

const TransactionList = ({ transactions }: { transactions: Transaction[] }) => {
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
                <ArrowDownCircle className={`w-6 h-6 ${transaction.target === "bank" ? "text-blue-500" : "text-primary"}`} />
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
                  : transaction.target === "bank"
                  ? "text-blue-500"
                  : "text-primary"
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