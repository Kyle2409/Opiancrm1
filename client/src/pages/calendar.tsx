import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appointmentsApi, clientsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  User
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from "date-fns";
import AddAppointmentModal from "@/components/modals/add-appointment-modal";
import { useTheme } from "@/contexts/theme-context";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { theme, themes } = useTheme();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: appointmentsApi.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: clientsApi.getAll,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then(res => res.json()),
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  // Team member color mapping
  const getTeamMemberColor = (userId: number | null) => {
    if (!userId) return "bg-gray-500 text-white";
    
    const userIndex = users.findIndex(user => user.id === userId);
    const colors = [
      "bg-blue-500 text-white",
      "bg-green-500 text-white", 
      "bg-purple-500 text-white",
      "bg-orange-500 text-white",
      "bg-pink-500 text-white",
      "bg-indigo-500 text-white",
      "bg-red-500 text-white",
      "bg-yellow-600 text-white",
      "bg-teal-500 text-white",
      "bg-violet-500 text-white",
    ];
    
    return userIndex >= 0 ? colors[userIndex % colors.length] : "bg-gray-500 text-white";
  };

  const getTeamMemberName = (userId: number | null) => {
    if (!userId) return "Unassigned";
    const user = users.find(u => u.id === userId);
    return user ? (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username) : "Unknown";
  };

  const getAppointmentColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-primary text-primary-foreground";
      case "consultation":
        return "bg-blue-500 text-white";
      case "demo":
        return "bg-purple-500 text-white";
      case "follow-up":
        return "bg-green-500 text-white";
      case "strategy":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getClientName = (clientId: number | null) => {
    if (!clientId) return "No client";
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.surname}` : "Client not found";
  };

  if (isLoading) {
    return (
      <div 
        className="p-6 min-h-screen transition-all duration-300"
        style={{
          backgroundColor: themes[theme].colors.background,
          color: themes[theme].colors.text,
        }}
      >
        <Card
          className="transition-all duration-300"
          style={{
            backgroundColor: themes[theme].colors.surface,
            borderColor: themes[theme].colors.border,
          }}
        >
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div 
      className="p-6 space-y-6 relative min-h-screen overflow-x-hidden transition-all duration-300"
      style={{
        backgroundColor: themes[theme].colors.background,
        color: themes[theme].colors.text,
      }}
    >
      {/* Theme-aware background decoration */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(to bottom right, ${themes[theme].colors.primary}05, transparent, ${themes[theme].colors.surface}30)`
        }}
      ></div>
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse -z-10 transform translate-x-1/2 -translate-y-1/2"
        style={{
          background: `linear-gradient(to bottom right, ${themes[theme].colors.primary}20, ${themes[theme].colors.secondary}20)`
        }}
      ></div>
      
      <Card
        className="backdrop-blur-sm shadow-xl transition-all duration-300"
        style={{
          backgroundColor: `${themes[theme].colors.surface}80`,
          borderColor: `${themes[theme].colors.border}50`,
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle 
              className="transition-colors duration-300"
              style={{ color: themes[theme].colors.text }}
            >
              Calendar
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h4 
                  className="text-lg font-medium transition-colors duration-300"
                  style={{ color: themes[theme].colors.text }}
                >
                  {format(currentDate, 'MMMM yyyy')}
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant={viewMode === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                >
                  Month
                </Button>
                <Button 
                  variant={viewMode === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                >
                  Week
                </Button>
                <Button 
                  variant={viewMode === "day" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("day")}
                >
                  Day
                </Button>
              </div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-2xl px-6 py-3 font-medium group"
                style={{
                  background: themes[theme].colors.gradient,
                }}
              >
                <Plus className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
                Add Meeting
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map(day => (
                <div 
                  key={day} 
                  className="text-center py-2 text-sm font-medium transition-colors duration-300"
                  style={{ color: themes[theme].colors.textSecondary }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayAppointments = getAppointmentsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);

                return (
                  <div 
                    key={index} 
                    className={`min-h-24 p-2 border transition-all duration-300 ${
                      !isCurrentMonth ? 'opacity-50' : ''
                    }`}
                    style={{
                      backgroundColor: isDayToday 
                        ? `${themes[theme].colors.primary}20` 
                        : (!isCurrentMonth ? themes[theme].colors.surface : themes[theme].colors.background),
                      borderColor: isDayToday 
                        ? themes[theme].colors.primary 
                        : themes[theme].colors.border,
                      color: themes[theme].colors.text,
                    }}
                  >
                    <div 
                      className={`text-sm mb-1 transition-colors duration-300 ${
                        isDayToday ? 'font-bold' : 
                        isCurrentMonth ? 'font-medium' : 'font-normal'
                      }`}
                      style={{
                        color: isDayToday 
                          ? themes[theme].colors.primary 
                          : (isCurrentMonth ? themes[theme].colors.text : themes[theme].colors.textSecondary)
                      }}
                    >
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.map((appointment) => (
                        <div 
                          key={appointment.id}
                          className={`text-xs px-2 py-1 rounded transition-all duration-200 hover:shadow-md ${getTeamMemberColor(appointment.assignedToId || appointment.userId)}`}
                          title={`Assigned to: ${getTeamMemberName(appointment.assignedToId || appointment.userId)}`}
                        >
                          <div className="font-medium">{appointment.startTime}</div>
                          <div className="truncate">{appointment.title}</div>
                          <div className="truncate text-xs opacity-90">
                            {getClientName(appointment.clientId)}
                          </div>
                          <div className="truncate text-xs opacity-75 font-medium">
                            {getTeamMemberName(appointment.assignedToId || appointment.userId)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Member Legend */}
      {users.length > 0 && (
        <Card 
          className="backdrop-blur-sm shadow-xl transition-all duration-300"
          style={{
            backgroundColor: `${themes[theme].colors.surface}80`,
            borderColor: `${themes[theme].colors.border}50`,
          }}
        >
          <CardHeader>
            <CardTitle 
              className="text-lg font-bold transition-colors duration-300 flex items-center"
              style={{ color: themes[theme].colors.text }}
            >
              <User className="w-5 h-5 mr-2" />
              Team Member Legend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Badge 
                    className={`text-xs px-2 py-1 ${getTeamMemberColor(user.id)}`}
                  >
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AddAppointmentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
