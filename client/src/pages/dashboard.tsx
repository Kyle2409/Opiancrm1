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
  MapPin,
  Wifi,
  WifiOff
} from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, startOfWeek, endOfWeek } from "date-fns";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePresence } from "@/hooks/use-presence";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { users: presenceUsers } = usePresence();
  
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
      color: "from-blue-500 to-blue-600",
      change: "+24.5%",
      changeType: "positive" as const,
      subtitle: `Avg: $${Math.round(avgDealSize).toLocaleString()} per client`,
    },
    {
      title: "Active Clients",
      value: activeClients.length,
      icon: Users,
      color: "from-green-500 to-green-600",
      change: `+${prospectClients.length} prospects`,
      changeType: "positive" as const,
      subtitle: `${Math.round((activeClients.length / clients.length) * 100)}% conversion rate`,
    },
    {
      title: "This Week",
      value: weekAppointments.length,
      icon: Calendar,
      color: "from-purple-500 to-purple-600",
      change: `${todayAppointments.length} today`,
      changeType: "neutral" as const,
      subtitle: `${tomorrowAppointments.length} tomorrow`,
    },
    {
      title: "Growth Rate",
      value: "+18.2%",
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      change: "vs last month",
      changeType: "positive" as const,
      subtitle: "Above industry avg",
    },
  ];

  return (
    <div className="p-4 space-y-4 bg-gradient-to-br from-slate-50 to-white h-full relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-50/30 -z-10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-full blur-3xl animate-pulse -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-600/20 to-primary/20 rounded-full blur-3xl animate-pulse -z-10 transform -translate-x-1/2 translate-y-1/2"></div>
      
      {/* Welcome Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-900">Good morning, {user?.username || 'User'}! 👋</h1>
              {user?.role === 'super_admin' && (
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  Super Admin
                </Badge>
              )}
              {user?.role === 'admin' && (
                <Badge className="bg-blue-600 text-white">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mt-1">Here's what's happening with your business today.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <Activity className="w-3 h-3 mr-1" />
              All systems operational
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards with Stained Glass Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group transform hover:scale-105 hover:-translate-y-2">
              {/* Light blue stained glass base */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/98 via-white/95 to-white/98" />
              
              {/* Light blue stained glass segments */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-1/2 h-1/3 bg-gradient-to-br from-blue-200/40 via-blue-300/25 to-transparent" />
                <div className="absolute top-0 right-0 w-1/2 h-2/5 bg-gradient-to-bl from-sky-200/35 via-sky-300/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-2/3 h-1/2 bg-gradient-to-tr from-cyan-200/30 via-cyan-300/18 to-transparent" />
                <div className="absolute bottom-0 right-0 w-1/2 h-1/3 bg-gradient-to-tl from-indigo-200/35 via-indigo-300/20 to-transparent" />
                <div className="absolute top-1/3 left-1/4 w-1/2 h-1/3 bg-gradient-to-br from-blue-300/25 via-blue-400/15 to-transparent" />
                <div className="absolute top-1/2 right-1/4 w-1/3 h-1/4 bg-gradient-to-bl from-slate-300/30 via-slate-400/18 to-transparent" />
              </div>
              
              {/* Lead lines effect */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/3 left-0 w-full h-px bg-slate-500/50" />
                <div className="absolute top-2/3 left-0 w-full h-px bg-slate-500/50" />
                <div className="absolute top-0 left-1/3 h-full w-px bg-slate-500/50" />
                <div className="absolute top-0 left-2/3 h-full w-px bg-slate-500/50" />
              </div>
              
              {/* Glass reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Subtle border */}
              <div className="absolute inset-0 rounded-lg border border-slate-400/30 shadow-inner"></div>
              <CardContent className="p-4 relative z-10 backdrop-blur-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-sm font-semibold text-slate-700 drop-shadow-sm">{stat.title}</p>
                      {stat.changeType === 'positive' && (
                        <ArrowUpRight className="w-3 h-3 text-emerald-600 drop-shadow-sm" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mb-1 drop-shadow-sm">{stat.value}</p>
                    <p className="text-xs text-slate-600 mb-2 drop-shadow-sm">{stat.subtitle}</p>
                    <div className="flex items-center space-x-1">
                      <span className={`text-sm font-semibold drop-shadow-sm ${
                        stat.changeType === 'positive' ? 'text-emerald-700' : 'text-slate-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/50 relative`}>
                    <Icon className="w-6 h-6 text-white drop-shadow-md" />
                    <div className="absolute inset-0 bg-white/25 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Client Activity - Light Blue Stained Glass */}
        <div className="lg:col-span-2">
          <Card className="relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
            {/* Light blue stained glass base */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/98 via-white/95 to-white/98" />
            
            {/* Light blue stained glass segments */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-1/2 h-1/3 bg-gradient-to-br from-blue-200/40 via-blue-300/25 to-transparent" />
              <div className="absolute top-0 right-0 w-1/2 h-2/5 bg-gradient-to-bl from-sky-200/35 via-sky-300/20 to-transparent" />
              <div className="absolute bottom-0 left-0 w-2/3 h-1/2 bg-gradient-to-tr from-cyan-200/30 via-cyan-300/18 to-transparent" />
              <div className="absolute bottom-0 right-0 w-1/2 h-1/3 bg-gradient-to-tl from-indigo-200/35 via-indigo-300/20 to-transparent" />
              <div className="absolute top-1/3 left-1/4 w-1/2 h-1/3 bg-gradient-to-br from-blue-300/25 via-blue-400/15 to-transparent" />
              <div className="absolute top-1/2 right-1/4 w-1/3 h-1/4 bg-gradient-to-bl from-slate-300/30 via-slate-400/18 to-transparent" />
            </div>
            
            {/* Lead lines effect */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/3 left-0 w-full h-px bg-slate-500/50" />
              <div className="absolute top-2/3 left-0 w-full h-px bg-slate-500/50" />
              <div className="absolute top-0 left-1/3 h-full w-px bg-slate-500/50" />
              <div className="absolute top-0 left-2/3 h-full w-px bg-slate-500/50" />
            </div>
            
            {/* Glass reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Subtle border */}
            <div className="absolute inset-0 rounded-lg border border-slate-400/30 shadow-inner"></div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-700 drop-shadow-sm">Client Activity</CardTitle>
                <Button 
                  onClick={() => setLocation("/clients")}
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-500 hover:text-gray-700"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 p-4">
              <div className="space-y-3">
                {recentClients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
                    <p className="text-gray-500">Add your first client to get started</p>
                  </div>
                ) : (
                  recentClients.map((client) => (
                    <div key={client.id} className="group relative">
                      <div className="flex items-center space-x-3 p-3 rounded-xl border-2 border-white/80 bg-white/95 hover:border-blue-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 backdrop-blur-md shadow-lg">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {(client.firstName?.[0] || '') + (client.surname?.[0] || '')}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            client.status === 'active' ? 'bg-green-500' : 
                            client.status === 'prospect' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{client.firstName} {client.surname}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Building className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-600">{client.employer || client.occupation || 'N/A'}</p>
                                <Badge className={`text-xs ${
                                  client.status === 'active' ? 'bg-green-100 text-green-700' :
                                  client.status === 'prospect' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {client.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                ${client.value?.toLocaleString() || 0}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(client.lastContact || client.createdAt), 'MMM d')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              <span>{client.email}</span>
                            </div>
                            {client.cellPhone && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
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
          {/* Quick Actions - Light Blue Stained Glass */}
          <Card className="relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group">
            {/* Light blue stained glass base */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/98 via-white/95 to-white/98" />
            
            {/* Light blue stained glass segments */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-br from-blue-200/35 via-blue-300/20 to-transparent" />
              <div className="absolute top-1/3 left-0 w-2/3 h-1/3 bg-gradient-to-bl from-sky-200/30 via-sky-300/18 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-tr from-cyan-200/25 via-cyan-300/15 to-transparent" />
              <div className="absolute top-1/4 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-indigo-200/30 via-indigo-300/18 to-transparent" />
            </div>
            
            {/* Lead lines pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/3 left-0 w-full h-px bg-slate-500/50" />
              <div className="absolute top-2/3 left-0 w-full h-px bg-slate-500/50" />
              <div className="absolute top-0 left-1/2 h-full w-px bg-slate-500/50" />
            </div>
            
            {/* Glass reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Subtle border */}
            <div className="absolute inset-0 rounded-lg border border-slate-400/30 shadow-inner"></div>
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-lg font-semibold text-slate-700 drop-shadow-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <Button 
                onClick={() => setLocation("/clients")}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Client
              </Button>
              <Button 
                onClick={() => setLocation("/booking")}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transition-all duration-200"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
              <Button 
                onClick={() => setLocation("/documents")}
                className="w-full h-12 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white shadow-md transition-all duration-200"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </CardContent>
          </Card>

          {/* Today's Schedule - Enhanced with Light Blue Stained Glass */}
          <Card className="relative overflow-hidden border-0 shadow-2xl backdrop-blur-sm">
            {/* Light blue stained glass base */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/98 via-white/95 to-white/98" />
            
            {/* Light blue stained glass segments */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-2/3 h-1/2 bg-gradient-to-br from-blue-200/35 via-blue-300/20 to-transparent" />
              <div className="absolute top-0 right-0 w-1/2 h-2/3 bg-gradient-to-bl from-sky-200/30 via-sky-300/18 to-transparent" />
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-cyan-200/25 via-cyan-300/15 to-transparent" />
              <div className="absolute bottom-0 right-0 w-2/3 h-1/3 bg-gradient-to-tl from-indigo-200/30 via-indigo-300/18 to-transparent" />
            </div>
            
            {/* Lead lines pattern */}
            <div className="absolute inset-0 opacity-15">
              <div className="absolute top-1/2 left-0 w-full h-px bg-slate-600/60" />
              <div className="absolute top-0 left-1/3 h-full w-px bg-slate-600/60" />
              <div className="absolute top-0 left-2/3 h-full w-px bg-slate-600/60" />
            </div>
            
            <div className="absolute inset-0 rounded-lg border border-slate-400/30 shadow-inner"></div>
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-700 drop-shadow-sm">Today's Schedule</CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {todayAppointments.length} meetings
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No meetings today</p>
                    <p className="text-xs text-gray-400 mt-1">Enjoy your free time!</p>
                  </div>
                ) : (
                  todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="relative">
                      <div className="flex items-start space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 hover:shadow-md transition-all duration-200">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex flex-col items-center justify-center text-white shadow-md">
                            <span className="text-xs font-bold">{appointment.startTime.split(':')[0]}</span>
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
                            <div className="flex items-center space-x-1 mt-1">
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


        </div>
      </div>
    </div>
  );
}
