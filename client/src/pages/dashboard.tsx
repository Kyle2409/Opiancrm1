import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statsApi, clientsApi, appointmentsApi } from "@/lib/api";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Plus,
  CalendarPlus,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  Building,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, startOfWeek, endOfWeek } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
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

  const recentClients = Array.isArray(clients) ? clients.slice(0, 5) : [];
  const todayAppointments = Array.isArray(appointments) ? appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return isToday(aptDate);
  }) : [];
  
  const tomorrowAppointments = Array.isArray(appointments) ? appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return isTomorrow(aptDate);
  }) : [];
  
  const weekAppointments = Array.isArray(appointments) ? appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return isThisWeek(aptDate, { weekStartsOn: 0 });
  }) : [];

  // Calculate trends and insights
  const activeClients = Array.isArray(clients) ? clients.filter(c => c.status === 'active') : [];
  const prospectClients = Array.isArray(clients) ? clients.filter(c => c.status === 'prospect') : [];
  const totalRevenue = clients.reduce((sum, client) => sum + (client.value || 0), 0);
  const avgDealSize = totalRevenue / clients.length || 0;

  const getClientName = (clientId: number | null) => {
    if (!clientId) return "No client";
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.firstName} ${client.surname}` : "Client not found";
  };

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
      title: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "from-slate-600 to-slate-700",
      bgColor: "bg-slate-50",
      iconColor: "text-slate-600",
      change: "+24.5%",
      changeType: "positive" as const,
      subtitle: `Avg: $${Math.round(avgDealSize).toLocaleString()} per client`,
    },
    {
      title: "Active Clients",
      value: activeClients.length,
      icon: Users,
      color: "from-slate-600 to-slate-700",
      bgColor: "bg-slate-50",
      iconColor: "text-slate-600",
      change: `+${prospectClients.length} prospects`,
      changeType: "positive" as const,
      subtitle: `${Math.round((activeClients.length / clients.length) * 100)}% conversion rate`,
    },
    {
      title: "This Week",
      value: weekAppointments.length,
      icon: Calendar,
      color: "from-slate-600 to-slate-700",
      bgColor: "bg-slate-50",
      iconColor: "text-slate-600",
      change: `${todayAppointments.length} today`,
      changeType: "neutral" as const,
      subtitle: `${tomorrowAppointments.length} tomorrow`,
    },
    {
      title: "Growth Rate",
      value: "+18.2%",
      icon: TrendingUp,
      color: "from-slate-600 to-slate-700",
      bgColor: "bg-slate-50",
      iconColor: "text-slate-600",
      change: "vs last month",
      changeType: "positive" as const,
      subtitle: "Above industry avg",
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-gray-50 to-white min-h-screen relative overflow-x-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(15,23,42,0.05)_1px,_transparent_0)] [background-size:24px_24px] -z-10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-slate-200/30 to-slate-300/20 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Professional Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              <h1 className="text-4xl font-light text-slate-900 tracking-tight">
                Good morning, {user?.username || 'User'}
              </h1>
              {user?.role === 'super_admin' && (
                <Badge className="bg-slate-900 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Super Admin
                </Badge>
              )}
              {user?.role === 'admin' && (
                <Badge className="bg-slate-700 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-slate-600 mt-2 text-lg font-light">Here's your business overview for today</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50/50 font-medium">
              <Activity className="w-3 h-3 mr-1" />
              All systems operational
            </Badge>
          </div>
        </div>
      </div>

      {/* Professional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 group bg-white">
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">{stat.title}</p>
                      {stat.changeType === 'positive' && (
                        <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">{stat.value}</p>
                    <p className="text-xs text-slate-500 mb-3 font-medium">{stat.subtitle}</p>
                    <div className="flex items-center space-x-1">
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-emerald-600' : 'text-slate-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center border border-slate-200/60 group-hover:border-slate-300 transition-colors duration-200`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Client Activity - Professional */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200/60 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-slate-900">Recent Client Activity</CardTitle>
                <Button 
                  onClick={() => setLocation("/clients")}
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-500 hover:text-slate-700 font-medium"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClients.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No clients yet</h3>
                    <p className="text-slate-500">Add your first client to get started</p>
                  </div>
                ) : (
                  recentClients.map((client) => (
                    <div key={client.id} className="group relative">
                      <div className="flex items-center space-x-4 p-4 rounded-lg border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
                        <div className="relative">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200/60">
                            <span className="text-slate-700 font-medium text-sm">
                              {(client.firstName?.[0] || '') + (client.surname?.[0] || '')}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            client.status === 'active' ? 'bg-emerald-500' : 
                            client.status === 'prospect' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{client.firstName} {client.surname}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Building className="w-3 h-3 text-slate-400" />
                                <p className="text-xs text-slate-600">{client.employer || client.occupation || 'N/A'}</p>
                                <Badge className={`text-xs font-medium ${
                                  client.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                  client.status === 'prospect' ? 'bg-amber-100 text-amber-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {client.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-900">
                                ${client.value?.toLocaleString() || 0}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(new Date(client.lastContact || client.createdAt), 'MMM d')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-1 text-xs text-slate-500">
                              <Mail className="w-3 h-3" />
                              <span>{client.email}</span>
                            </div>
                            {client.cellPhone && (
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                <Phone className="w-3 h-3" />
                                <span>{client.cellPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions - Professional */}
          <Card className="border border-slate-200/60 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg font-medium text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <Button 
                onClick={() => setLocation("/clients")}
                className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200 font-medium"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Client
              </Button>
              <Button 
                onClick={() => setLocation("/booking")}
                className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200 font-medium"
                variant="outline"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
              <Button 
                onClick={() => setLocation("/documents")}
                className="w-full h-12 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 transition-all duration-200 font-medium"
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </CardContent>
          </Card>

          {/* Today's Schedule - Professional */}
          <Card className="border border-slate-200/60 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-slate-900">Today's Schedule</CardTitle>
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium">
                  {todayAppointments.length} meetings
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                    <p className="text-sm text-slate-500">No meetings today</p>
                    <p className="text-xs text-slate-400 mt-1">Enjoy your free time!</p>
                  </div>
                ) : (
                  todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="relative">
                      <div className="flex items-start space-x-3 p-4 rounded-lg border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-700 border border-slate-200/60">
                            <span className="text-xs font-medium">{appointment.startTime.split(':')[0]}</span>
                            <span className="text-xs">{appointment.startTime.split(':')[1]}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{appointment.title}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {getClientName(appointment.clientId)}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`text-xs ${
                              appointment.type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                              appointment.type === 'call' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {appointment.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {appointment.startTime} - {appointment.endTime}
                            </span>
                          </div>
                          {appointment.location && (
                            <div className="flex items-center space-x-1 mt-2">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500 truncate">{appointment.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Insights */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Conversion Rate</span>
                  </div>
                  <span className="text-sm font-semibold text-green-600">67%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Avg. Deal Size</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">${Math.round(avgDealSize).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Response Time</span>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">2.3h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
