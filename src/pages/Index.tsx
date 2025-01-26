import { useState } from "react";
import EventSelector from "@/components/EventSelector";
import CashRegister from "@/components/CashRegister";
import type { Event } from "@/components/EventSelector";

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
            <EventSelector onEventChange={setCurrentEvent} />
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