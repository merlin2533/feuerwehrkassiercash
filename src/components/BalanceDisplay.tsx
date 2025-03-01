
import { useState } from "react";
import type { CashRegisterBalance } from "@/utils/localStorage";
import type { Denomination } from "@/types/models";
import { ChevronDown, ChevronUp } from "lucide-react";

interface BalanceDisplayProps {
  registers: CashRegisterBalance[];
  bankBalance: number;
}

const BalanceDisplay = ({ registers, bankBalance }: BalanceDisplayProps) => {
  const [expandedRegisters, setExpandedRegisters] = useState<Record<string, boolean>>({});
  
  // Calculate total balance
  const totalBalance = registers.reduce((sum, register) => sum + register.balance, 0) + bankBalance;

  const toggleRegister = (id: string) => {
    setExpandedRegisters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {registers.map((register) => (
          <div key={register.id} className="p-4 bg-white rounded-lg shadow-md">
            <div 
              className="flex justify-between items-center cursor-pointer" 
              onClick={() => toggleRegister(register.id)}
            >
              <h3 className="text-lg font-semibold text-gray-800">{register.name}</h3>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-primary">{register.balance.toFixed(2)}€</p>
                {expandedRegisters[register.id] ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
            
            {expandedRegisters[register.id] && register.denominations && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-2">Stückelung:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {register.denominations
                    .filter(d => d.count > 0)
                    .sort((a, b) => b.value - a.value)
                    .map(denom => (
                      <div key={denom.value} className="flex justify-between">
                        <span>{denom.value >= 1 ? `${denom.value}€` : `${denom.value * 100}¢`}:</span>
                        <span className="font-medium">{denom.count}×</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default BalanceDisplay;
