import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

const BILLS = [
  { value: 500, label: "500€" },
  { value: 200, label: "200€" },
  { value: 100, label: "100€" },
  { value: 50, label: "50€" },
  { value: 20, label: "20€" },
  { value: 10, label: "10€" },
  { value: 5, label: "5€" },
  { value: 2, label: "2€" },
  { value: 1, label: "1€" },
];

const BillCalculator = ({ onTotalChange }: { onTotalChange: (total: number) => void }) => {
  const [counts, setCounts] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const total = Object.entries(counts).reduce(
      (sum, [bill, count]) => sum + Number(bill) * count,
      0
    );
    onTotalChange(total);
  }, [counts, onTotalChange]);

  // Reset when total is set to 0 externally
  useEffect(() => {
    const total = Object.entries(counts).reduce(
      (sum, [bill, count]) => sum + Number(bill) * count,
      0
    );
    if (total > 0 && onTotalChange.toString().includes("setAmount(0)")) {
      setCounts({});
    }
  }, [counts, onTotalChange]);

  const handleCountChange = (bill: number, count: string) => {
    const newCount = parseInt(count) || 0;
    setCounts(prev => ({ ...prev, [bill]: newCount }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 col-span-full">Scheinrechner</h2>
      {BILLS.map(({ value, label }) => (
        <div key={value} className="flex items-center gap-2">
          <label className="w-16 font-medium">{label}</label>
          <Input
            type="number"
            min="0"
            value={counts[value] || ""}
            onChange={(e) => handleCountChange(value, e.target.value)}
            className="w-24"
          />
        </div>
      ))}
    </div>
  );
};

export default BillCalculator;