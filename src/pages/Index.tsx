import EventSelector from "@/components/EventSelector";
import CashRegister from "@/components/CashRegister";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">
              Feuerwehr Kassenbuch
            </h1>
            <EventSelector />
          </div>
        </div>
      </header>
      <div className="container py-8 space-y-6">
        <CashRegister />
      </div>
    </div>
  );
};

export default Index;