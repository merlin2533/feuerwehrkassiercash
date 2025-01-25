import EventSelector from "@/components/EventSelector";
import CashRegister from "@/components/CashRegister";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 space-y-6">
        <h1 className="text-4xl font-bold text-primary text-center mb-8">
          Feuerwehr Kassenbuch
        </h1>
        <EventSelector />
        <CashRegister />
      </div>
    </div>
  );
};

export default Index;