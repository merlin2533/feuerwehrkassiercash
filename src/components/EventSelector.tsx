
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { getEvents, saveEvents } from "@/utils/localStorage";

export interface Event {
  id: string;
  name: string;
  created_at: string;
}

interface EventSelectorProps {
  onEventChange: (event: Event) => void;
}

const EventSelector = ({ onEventChange }: EventSelectorProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newEventName, setNewEventName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    const storedEvents = getEvents();
    setEvents(storedEvents);
    
    // Set the first event as the selected event by default if none is selected
    if (storedEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(storedEvents[0]);
      onEventChange(storedEvents[0]);
    }
  };

  const handleCreateEvent = () => {
    if (!newEventName.trim()) return;
    
    const newEvent: Event = {
      id: crypto.randomUUID(),
      name: newEventName,
      created_at: new Date().toISOString(),
    };
    
    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    setEvents(updatedEvents);
    setSelectedEvent(newEvent);
    onEventChange(newEvent);
    setNewEventName("");
    setOpen(false);
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    onEventChange(event);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="font-medium">Veranstaltung:</div>
      <select
        className="border rounded px-2 py-1 min-w-[200px]"
        value={selectedEvent?.id || ""}
        onChange={(e) => {
          const event = events.find((ev) => ev.id === e.target.value);
          if (event) handleSelectEvent(event);
        }}
      >
        {events.length === 0 && (
          <option value="" disabled>
            Keine Veranstaltungen
          </option>
        )}
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name}
          </option>
        ))}
      </select>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Neu
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Veranstaltung erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Name der Veranstaltung"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateEvent}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventSelector;
