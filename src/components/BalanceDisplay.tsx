
import type { CashRegisterBalance } from "@/utils/localStorage";

interface BalanceDisplayProps {
  registers: CashRegisterBalance[];
  bankBalance: number;
}

const BalanceDisplay = ({ registers, bankBalance }: BalanceDisplayProps) => {
  // Calculate total balance
  const totalBalance = registers.reduce((sum, register) => sum + register.balance, 0) + bankBalance;

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
            <h3 className="text-lg font-semibold text-gray-800">{register.name}</h3>
            <p className="text-2xl font-bold text-primary">{register.balance.toFixed(2)}€</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default BalanceDisplay;
