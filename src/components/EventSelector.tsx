import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    <div className="flex items-center gap-2">
      <select
        className="h-10 rounded-md border border-input bg-background px-3 py-2"
        value={selectedEvent}
        onChange={(e) => setSelectedEvent(e.target.value)}
      >
        {events.map((event) => (
          <option key={event} value={event}>
            {event}
          </option>
        ))}
      </select>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">Neue Veranstaltung</h4>
            <div className="flex gap-2">
              <Input
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                placeholder="Name der Veranstaltung"
              />
              <Button onClick={handleAddEvent}>
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default EventSelector;