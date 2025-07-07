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

  const recentClients = clients.slice(0, 5);
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return isToday(aptDate);
  });
  
  const tomorrowAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return isTomorrow(aptDate);
  });
  
  const weekAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return isThisWeek(aptDate, { weekStartsOn: 0 });
  });

  // Calculate trends and insights
  const activeClients = clients.filter(c => c.status === 'active');
  const prospectClients = clients.filter(c => c.status === 'prospect');
  const totalRevenue = clients.reduce((sum, client) => sum + (client.value || 0), 0);
  const avgDealSize = totalRevenue / clients.length || 0;

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
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Good morning, John! 👋</h1>
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

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      {stat.changeType === 'positive' && (
                        <ArrowUpRight className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-500 mb-3">{stat.subtitle}</p>
                    <div className="flex items-center space-x-1">
                      <span className={`text-sm font-medium ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Client Activity - Enhanced */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900">Client Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClients.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
                    <p className="text-gray-500">Add your first client to get started</p>
                  </div>
                ) : (
                  recentClients.map((client) => (
                    <div key={client.id} className="group relative">
                      <div className="flex items-center space-x-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            client.status === 'active' ? 'bg-green-500' : 
                            client.status === 'prospect' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Building className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-600">{client.company}</p>
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
                          <div className="flex items-center space-x-4 mt-3">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              <span>{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3" />
                                <span>{client.phone}</span>
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
          {/* Quick Actions - Enhanced */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Add New Client
              </Button>
              <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md transition-all duration-200">
                <CalendarPlus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-md transition-all duration-200">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documents
              </Button>
            </CardContent>
          </Card>

          {/* Today's Schedule - Enhanced */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Today's Schedule</CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {todayAppointments.length} meetings
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500">No meetings today</p>
                    <p className="text-xs text-gray-400 mt-1">Enjoy your free time!</p>
                  </div>
                ) : (
                  todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="relative">
                      <div className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 hover:shadow-md transition-all duration-200">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex flex-col items-center justify-center text-white shadow-md">
                            <span className="text-xs font-bold">{appointment.startTime.split(':')[0]}</span>
                            <span className="text-xs">{appointment.startTime.split(':')[1]}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{appointment.title}</p>
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
