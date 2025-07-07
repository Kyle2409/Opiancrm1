import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Users, 
  FileText, 
  Calendar, 
  Clock, 
  BarChart3
} from "lucide-react";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/documents", label: "Documents", icon: FileText },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/appointments", label: "Appointments", icon: Clock },
];

export default function Sidebar() {
  const [location] = useLocation();

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
        <div className="flex items-center space-x-3">
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32" 
            alt="User Profile" 
            className="w-8 h-8 rounded-full"
          />
          <div>
            <p className="text-sm font-medium text-textPrimary">John Anderson</p>
            <p className="text-xs text-gray-500">Account Manager</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
