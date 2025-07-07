import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi, clientsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar,
  Phone,
  Video,
  Users,
  Edit,
  Trash2,
  Plus,
  MapPin,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import AddAppointmentModal from "@/components/modals/add-appointment-modal";

export default function Appointments() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: appointmentsApi.getAll,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: clientsApi.getAll,
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: appointmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Appointment deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredAppointments = appointments.filter(appointment => {
    if (statusFilter === "all") return true;
    return appointment.status === statusFilter;
  });

  const handleDeleteAppointment = (id: number) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      deleteAppointmentMutation.mutate(id);
    }
  };

  const getAppointmentIcon = (type: string) => {
    switch (type) {
      case "meeting":
        return <Users className="w-5 h-5" />;
      case "call":
        return <Phone className="w-5 h-5" />;
      case "review":
        return <Calendar className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getAppointmentColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-primary bg-opacity-10 text-primary";
      case "call":
        return "bg-secondary bg-opacity-10 text-secondary";
      case "review":
        return "bg-warning bg-opacity-10 text-warning";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-600";
      case "completed":
        return "bg-secondary/10 text-secondary";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getClientName = (clientId: number | null) => {
    if (!clientId) return "No client assigned";
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.name} (${client.company})` : "Unknown client";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Appointments</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Appointments</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-textPrimary mb-2">
                {statusFilter === "all" ? "No appointments scheduled" : `No ${statusFilter} appointments found`}
              </h3>
              <p className="text-gray-500 mb-4">
                {statusFilter === "all" 
                  ? "Schedule your first appointment to get started."
                  : `Try adjusting your filter or schedule a new appointment.`
                }
              </p>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getAppointmentColor(appointment.type)}`}>
                          {getAppointmentIcon(appointment.type)}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-textPrimary">{appointment.title}</h4>
                          <p className="text-sm text-gray-500">{getClientName(appointment.clientId)}</p>
                          {appointment.description && (
                            <p className="text-sm text-gray-600 mt-1">{appointment.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-textPrimary">
                          {format(new Date(appointment.date), 'EEE, MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.startTime} - {appointment.endTime}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Badge className={getAppointmentColor(appointment.type)}>
                          {appointment.type}
                        </Badge>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        {appointment.location && (
                          <span className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {appointment.location}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {appointment.type === "call" && (
                          <Button variant="ghost" size="sm">
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                        )}
                        {appointment.type === "meeting" && (
                          <Button variant="ghost" size="sm">
                            <Video className="w-4 h-4 mr-1" />
                            Join
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          disabled={deleteAppointmentMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddAppointmentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
