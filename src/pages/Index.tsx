
import { useState } from "react";
import EventSelector from "@/components/EventSelector";
import CashRegister from "@/components/CashRegister";
import type { Event } from "@/components/EventSelector";
import { Button } from "@/components/ui/button";
import { Settings, Upload, Download } from "lucide-react";
import TransactionExcel from "@/components/TransactionExcel";
import { getTransactions } from "@/utils/localStorage";

const Index = () => {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">
              Feuerwehr Kassenbuch
            </h1>
            <div className="flex items-center gap-2">
              <EventSelector onEventChange={setCurrentEvent} />
              {currentEvent && (
                <TransactionExcel 
                  transactions={getTransactions().filter(t => t.event_id === currentEvent.id)}
                  registers={[]}
                  buttonIcon={<Download className="w-4 h-4 mr-1" />}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                />
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="container py-8 space-y-6">
        {currentEvent && <CashRegister currentEvent={currentEvent} />}
      </div>
    </div>
  );
};

export default Index;
