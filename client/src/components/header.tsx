import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Plus, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationContext } from "@/contexts/notification-context";
import { NotificationDropdown } from "@/components/notification-dropdown";
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
  const { user, logoutMutation } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationContext();

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
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearAll={clearAll}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "Logging out..." : "Log out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
