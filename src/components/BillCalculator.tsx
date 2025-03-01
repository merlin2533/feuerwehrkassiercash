
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { DEFAULT_DENOMINATIONS } from "@/types/models";
import type { Denomination, DenominationCount } from "@/types/models";

interface BillCalculatorProps { 
  onTotalChange: (total: number) => void;
  onDenominationsChange?: (denominations: Denomination[]) => void;
  initialDenominations?: DenominationCount;
}

const BillCalculator = ({ 
  onTotalChange, 
  onDenominationsChange,
  initialDenominations = {}
}: BillCalculatorProps) => {
  const [counts, setCounts] = useState<DenominationCount>(initialDenominations);

  useEffect(() => {
    const total = Object.entries(counts).reduce(
      (sum, [bill, count]) => sum + Number(bill) * count,
      0
    );
    onTotalChange(total);

    if (onDenominationsChange) {
      const denominations = Object.entries(counts)
        .filter(([_, count]) => count > 0)
        .map(([value, count]) => ({
          value: Number(value),
          count
        }));
      onDenominationsChange(denominations);
    }
  }, [counts, onTotalChange, onDenominationsChange]);

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
      {DEFAULT_DENOMINATIONS.map(({ value, label }) => (
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
