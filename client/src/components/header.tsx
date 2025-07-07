import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Plus, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AddClientModal from "@/components/modals/add-client-modal";
import AddAppointmentModal from "@/components/modals/add-appointment-modal";

const pageTitles = {
  "/": { title: "Dashboard", subtitle: "Welcome back! Here's your overview" },
  "/clients": { title: "Clients", subtitle: "Manage your client relationships" },
  "/documents": { title: "Documents", subtitle: "Upload and organize client documents" },
  "/calendar": { title: "Calendar", subtitle: "View and manage your schedule" },
  "/appointments": { title: "Appointments", subtitle: "Schedule and track meetings" },
};

export default function Header() {
  const [location] = useLocation();
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAddAppointmentModalOpen, setIsAddAppointmentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const currentPage = pageTitles[location as keyof typeof pageTitles] || pageTitles["/"];

  const handleAddButtonClick = () => {
    if (location === "/appointments" || location === "/calendar") {
      setIsAddAppointmentModalOpen(true);
    } else {
      setIsAddClientModalOpen(true);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary">{currentPage.title}</h1>
            <p className="text-sm text-gray-500">{currentPage.subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search clients, documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64"
              />
            </div>
            <Button 
              onClick={handleAddButtonClick}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              {location === "/appointments" || location === "/calendar" ? "Add Meeting" : "Add Client"}
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AddClientModal 
        isOpen={isAddClientModalOpen} 
        onClose={() => setIsAddClientModalOpen(false)} 
      />
      
      <AddAppointmentModal 
        isOpen={isAddAppointmentModalOpen} 
        onClose={() => setIsAddAppointmentModalOpen(false)} 
      />
    </>
  );
}
