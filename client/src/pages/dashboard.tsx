import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { statsApi, clientsApi, appointmentsApi } from "@/lib/api";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Plus,
  CalendarPlus,
  Upload
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: statsApi.get,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: clientsApi.getAll,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: appointmentsApi.getAll,
  });

  const recentClients = clients.slice(0, 3);
  const todayAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.date);
    return aptDate.toDateString() === today.toDateString();
  });

  if (statsLoading || clientsLoading || appointmentsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      icon: Users,
      color: "bg-primary",
      change: "+12% from last month",
      changeType: "positive" as const,
    },
    {
      title: "Active Projects",
      value: stats?.activeProjects || 0,
      icon: TrendingUp,
      color: "bg-secondary",
      change: "+8% from last month",
      changeType: "positive" as const,
    },
    {
      title: "Upcoming Meetings",
      value: stats?.upcomingMeetings || 0,
      icon: Calendar,
      color: "bg-warning",
      change: `Today: ${todayAppointments.length} meetings`,
      changeType: "neutral" as const,
    },
    {
      title: "Revenue",
      value: `$${stats?.revenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "bg-accent",
      change: "+15% from last month",
      changeType: "positive" as const,
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-textPrimary">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color.replace('bg-', '')}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm ${
                    stat.changeType === 'positive' 
                      ? 'text-secondary' 
                      : 'text-textPrimary'
                  }`}>
                    {stat.changeType === 'positive' && (
                      <TrendingUp className="inline w-4 h-4 mr-1" />
                    )}
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Client Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No clients found. Add your first client to get started.
                  </div>
                ) : (
                  recentClients.map((client) => (
                    <div key={client.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-textPrimary">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.company}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {format(new Date(client.lastContact || client.createdAt), 'MMM d')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add New Client
              </Button>
              <Button className="w-full bg-secondary hover:bg-secondary/90">
                <CalendarPlus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full bg-warning hover:bg-warning/90">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </CardContent>
          </Card>

          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No appointments today
                  </div>
                ) : (
                  todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border-l-4 border-primary">
                      <div className="text-center">
                        <p className="text-sm font-bold text-primary">{appointment.startTime}</p>
                        <p className="text-xs text-gray-500">
                          {appointment.startTime.includes('PM') ? 'PM' : 'AM'}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-textPrimary">{appointment.title}</p>
                        <p className="text-xs text-gray-500">{appointment.type}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
