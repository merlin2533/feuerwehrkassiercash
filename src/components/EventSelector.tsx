import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export type Event = {
  id: string;
  name: string;
  created_at: string;
};

const EventSelector = ({ onEventChange }: { onEventChange: (event: Event) => void }) => {
  const [newEvent, setNewEvent] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initial fetch of events
    fetchEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Veranstaltungen",
        variant: "destructive",
      });
      return;
    }

    setEvents(data);
    if (data.length > 0 && !selectedEvent) {
      setSelectedEvent(data[0]);
      onEventChange(data[0]);
    }
  };

  const handleAddEvent = async () => {
    if (newEvent.trim()) {
      const { data, error } = await supabase
        .from('events')
        .insert([{ name: newEvent }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Fehler",
          description: "Fehler beim Erstellen der Veranstaltung",
          variant: "destructive",
        });
        return;
      }

      setNewEvent("");
      setSelectedEvent(data);
      onEventChange(data);
    }
  };

  const handleEventChange = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      onEventChange(event);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-10 rounded-md border border-input bg-background px-3 py-2"
        value={selectedEvent?.id || ""}
        onChange={(e) => handleEventChange(e.target.value)}
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.name}
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