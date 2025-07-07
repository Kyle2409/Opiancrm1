import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appointmentsApi, clientsApi } from "@/lib/api";
import { teamMembersApi } from "@/lib/team-api";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";

export default function BookingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: appointmentsApi.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: clientsApi.getAll,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/team-members"],
    queryFn: teamMembersApi.getAll,
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return isSameDay(aptDate, date);
    });
  };

  const getClientName = (clientId: number | null) => {
    if (!clientId) return "No client";
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "Unknown client";
  };

  const getTeamMemberName = (teamMemberId: number | null) => {
    if (!teamMemberId) return null;
    const member = teamMembers.find(tm => tm.id === teamMemberId);
    return member ? member.name : "Unknown member";
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Booking Calendar</h1>
        <p className="text-gray-600">View all scheduled appointments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentDate, 'MMMM yyyy')}</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={previousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((date) => {
                const dayAppointments = getAppointmentsForDate(date);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                
                return (
                  <div
                    key={date.toISOString()}
                    className={`
                      min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                      ${isToday(date) ? 'bg-blue-50 border-blue-300' : ''}
                      ${!isSameMonth(date, currentDate) ? 'opacity-50' : ''}
                    `}
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        isToday(date) ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {format(date, 'd')}
                      </span>
                      {dayAppointments.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayAppointments.length}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                        >
                          {apt.startTime} {apt.title}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>
                {selectedDate 
                  ? format(selectedDate, 'MMMM d, yyyy')
                  : 'Select a date'
                }
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedDateAppointments.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateAppointments.map((apt) => (
                    <div key={apt.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{apt.title}</h4>
                        <Badge variant={apt.status === 'scheduled' ? 'default' : 'secondary'}>
                          {apt.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{apt.startTime} - {apt.endTime}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{getClientName(apt.clientId)}</span>
                        </div>
                        
                        {apt.assignedToId && (
                          <div className="text-purple-600 font-medium">
                            Assigned to: {getTeamMemberName(apt.assignedToId)}
                          </div>
                        )}
                        
                        {apt.location && (
                          <div className="text-gray-500">
                            Location: {apt.location}
                          </div>
                        )}
                        
                        {apt.description && (
                          <div className="text-gray-500 mt-2">
                            {apt.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments</h3>
                  <p className="text-gray-500">No bookings scheduled for this date</p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a date</h3>
                <p className="text-gray-500">Click on a date to view appointments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}