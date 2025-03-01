
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import type { CashRegisterBalance } from "@/utils/localStorage";

interface RegisterSelectorProps {
  registers: CashRegisterBalance[];
  selectedRegister: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

const RegisterSelector = ({ 
  registers, 
  selectedRegister, 
  onChange, 
  label,
  placeholder = "Kasse auswählen"
}: RegisterSelectorProps) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Select 
        value={selectedRegister} 
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {registers.map((register) => (
            <SelectItem key={register.id} value={register.id}>
              {register.name} {register.id === selectedRegister ? `(${register.balance.toFixed(2)}€)` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RegisterSelector;
