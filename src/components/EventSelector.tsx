import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

const EventSelector = () => {
  const [newEvent, setNewEvent] = useState("");
  const [events, setEvents] = useState(["Sommerfest 2024"]);
  const [selectedEvent, setSelectedEvent] = useState("Sommerfest 2024");

  const handleAddEvent = () => {
    if (newEvent.trim()) {
      setEvents([...events, newEvent]);
      setSelectedEvent(newEvent);
      setNewEvent("");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">Veranstaltung</h2>
      <div className="flex gap-2">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          {events.map((event) => (
            <option key={event} value={event}>
              {event}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Neue Veranstaltung"
          value={newEvent}
          onChange={(e) => setNewEvent(e.target.value)}
        />
        <Button onClick={handleAddEvent} className="bg-primary hover:bg-primary-dark">
          <Plus className="w-4 h-4 mr-2" />
          Hinzufügen
        </Button>
      </div>
    </div>
  );
};

export default EventSelector;