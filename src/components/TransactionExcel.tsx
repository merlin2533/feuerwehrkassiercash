
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import type { Transaction } from "./TransactionList";

interface TransactionExcelProps {
  transactions: Transaction[];
  onImport: (transactions: Transaction[]) => void;
}

const TransactionExcel = ({ transactions, onImport }: TransactionExcelProps) => {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      transactions.map(t => ({
        Datum: new Date(t.created_at).toLocaleString(),
        Typ: t.type === "deposit" ? "Einzahlung" : "Abhebung",
        Quelle: t.type === "deposit" ? t.target : "-",
        Ziel: t.type === "withdrawal" ? t.target : "-",
        Betrag: t.amount,
        Kommentar: t.comment || ""
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaktionen");
    
    XLSX.writeFile(workbook, "transaktionen.xlsx");
    
    toast({
      title: "Export erfolgreich",
      description: "Die Transaktionen wurden als Excel-Datei exportiert.",
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const newTransactions: Transaction[] = jsonData.map((row: any) => ({
        id: crypto.randomUUID(),
        event_id: "", // This will be set by the parent component
        type: row.Typ === "Einzahlung" ? "deposit" : "withdrawal",
        target: row.Typ === "Einzahlung" ? row.Quelle : row.Ziel,
        amount: Number(row.Betrag),
        comment: row.Kommentar || "",
        created_at: new Date().toISOString()
      }));

      onImport(newTransactions);
      
      toast({
        title: "Import erfolgreich",
        description: `${newTransactions.length} Transaktionen wurden importiert.`,
      });
    } catch (error) {
      toast({
        title: "Fehler beim Import",
        description: "Die Excel-Datei konnte nicht verarbeitet werden.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleExport} variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Excel Export
      </Button>
      <div className="relative">
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImport}
          disabled={importing}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        <Button variant="outline" disabled={importing}>
          <Upload className="w-4 h-4 mr-2" />
          Excel Import
        </Button>
      </div>
    </div>
  );
};

export default TransactionExcel;
