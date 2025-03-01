
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Download, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import type { Transaction } from "./TransactionList";
import { DEFAULT_DENOMINATIONS } from "@/types/models";

interface TransactionExcelProps {
  transactions: Transaction[];
  onImport: (transactions: Transaction[]) => void;
}

const TransactionExcel = ({ transactions, onImport }: TransactionExcelProps) => {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    // Create denomination column headers 
    const denominationHeaders = DEFAULT_DENOMINATIONS.map(d => 
      d.value >= 1 ? `${d.value}€` : `${d.value * 100}¢`
    );
    
    const worksheet = XLSX.utils.json_to_sheet(
      transactions.map(t => {
        // Create base transaction data
        const baseData = {
          Datum: new Date(t.created_at).toLocaleString(),
          Typ: t.type === "deposit" ? "Einzahlung" : "Abhebung",
          Quelle: t.type === "deposit" ? "-" : t.source || "-",
          Ziel: t.type === "withdrawal" ? t.target : "-",
          Betrag: t.amount,
          Kommentar: t.comment || ""
        };
        
        // Add denomination data if available
        const denominationData: Record<string, number> = {};
        
        if (t.denominations && t.denominations.length > 0) {
          t.denominations.forEach(d => {
            const key = d.value >= 1 ? `${d.value}€` : `${d.value * 100}¢`;
            denominationData[key] = d.count;
          });
        }
        
        // Combine base data with denomination data
        return { ...baseData, ...denominationData };
      })
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

      const newTransactions: Transaction[] = jsonData.map((row: any) => {
        // Parse basic transaction data
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          event_id: "", // This will be set by the parent component
          type: row.Typ === "Einzahlung" ? "deposit" : "withdrawal",
          target: row.Typ === "Einzahlung" ? row.Quelle : row.Ziel,
          source: row.Typ === "Abhebung" ? row.Quelle : undefined,
          amount: Number(row.Betrag),
          comment: row.Kommentar || "",
          created_at: new Date().toISOString(),
          denominations: []
        };
        
        // Parse denomination data if available
        const possibleDenominations = DEFAULT_DENOMINATIONS.map(d => 
          d.value >= 1 ? `${d.value}€` : `${d.value * 100}¢`
        );
        
        const denominations = possibleDenominations
          .filter(key => row[key] && Number(row[key]) > 0)
          .map(key => {
            // Convert key back to value (remove € or ¢ and convert)
            let value: number;
            if (key.endsWith('€')) {
              value = parseFloat(key.replace('€', ''));
            } else {
              value = parseFloat(key.replace('¢', '')) / 100;
            }
            
            return {
              value,
              count: Number(row[key])
            };
          });
        
        if (denominations.length > 0) {
          transaction.denominations = denominations;
        }
        
        return transaction;
      });

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
