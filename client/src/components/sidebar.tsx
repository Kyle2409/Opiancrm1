import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Users, 
  FileText, 
  Calendar, 
  Clock, 
  BarChart3,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/documents", label: "Documents", icon: FileText },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/appointments", label: "Appointments", icon: Clock },
  { path: "/team-members", label: "Team", icon: Users },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  return (
    <nav className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-textPrimary">Opian Core</span>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "nav-item",
                isActive && "active"
              )}>
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logoutMutation.isPending ? "Logging out..." : "Log out"}
        </Button>
      </div>

    </nav>
  );
}
