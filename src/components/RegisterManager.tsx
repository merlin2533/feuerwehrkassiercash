
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Plus, X, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { CashRegisterBalance } from "@/utils/localStorage";

interface RegisterManagerProps {
  registers: CashRegisterBalance[];
  onUpdateRegisters: (registers: CashRegisterBalance[]) => void;
}

const RegisterManager = ({ registers, onUpdateRegisters }: RegisterManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRegisterName, setNewRegisterName] = useState("");
  const [editingRegisterId, setEditingRegisterId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAddRegister = () => {
    if (!newRegisterName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen für die Kasse ein.",
        variant: "destructive"
      });
      return;
    }

    // Check if name already exists
    if (registers.some(r => r.name.toLowerCase() === newRegisterName.trim().toLowerCase())) {
      toast({
        title: "Fehler",
        description: "Eine Kasse mit diesem Namen existiert bereits.",
        variant: "destructive"
      });
      return;
    }

    if (editingRegisterId) {
      // Update existing register
      const updatedRegisters = registers.map(register => 
        register.id === editingRegisterId 
          ? { ...register, name: newRegisterName.trim() } 
          : register
      );
      onUpdateRegisters(updatedRegisters);
      toast({
        title: "Kasse aktualisiert",
        description: `Die Kasse wurde erfolgreich umbenannt in "${newRegisterName.trim()}".`
      });
    } else {
      // Add new register
      const newRegister: CashRegisterBalance = {
        id: crypto.randomUUID(),
        name: newRegisterName.trim(),
        balance: 0
      };
      onUpdateRegisters([...registers, newRegister]);
      toast({
        title: "Kasse hinzugefügt",
        description: `Die Kasse "${newRegisterName.trim()}" wurde erfolgreich hinzugefügt.`
      });
    }

    setNewRegisterName("");
    setEditingRegisterId(null);
    setIsDialogOpen(false);
  };

  const handleDeleteRegister = (id: string) => {
    const registerToDelete = registers.find(r => r.id === id);
    if (!registerToDelete) return;

    // If register has a balance, don't allow deletion
    if (registerToDelete.balance > 0) {
      toast({
        title: "Fehler",
        description: `Die Kasse "${registerToDelete.name}" hat noch einen Saldo von ${registerToDelete.balance.toFixed(2)}€ und kann nicht gelöscht werden.`,
        variant: "destructive"
      });
      return;
    }

    const updatedRegisters = registers.filter(register => register.id !== id);
    onUpdateRegisters(updatedRegisters);
    toast({
      title: "Kasse gelöscht",
      description: `Die Kasse "${registerToDelete.name}" wurde erfolgreich gelöscht.`
    });
  };

  const handleEditRegister = (register: CashRegisterBalance) => {
    setNewRegisterName(register.name);
    setEditingRegisterId(register.id);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Kassen verwalten</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setNewRegisterName("");
                setEditingRegisterId(null);
              }}
              className="bg-green-500 hover:bg-green-600"
            >
              <Plus className="w-4 h-4 mr-2" /> 
              Neue Kasse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRegisterId ? "Kasse umbenennen" : "Neue Kasse anlegen"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newRegisterName}
                onChange={e => setNewRegisterName(e.target.value)}
                placeholder="Kassenname"
                className="mb-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddRegister}>
                {editingRegisterId ? "Aktualisieren" : "Hinzufügen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {registers.map(register => (
          <div 
            key={register.id} 
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{register.name}</span>
              <span className="text-sm text-gray-500">
                (Saldo: {register.balance.toFixed(2)}€)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleEditRegister(register)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDeleteRegister(register.id)}
                disabled={register.balance > 0}
              >
                <X className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegisterManager;
