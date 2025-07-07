import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addDays, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { appointmentsApi } from "@/lib/api";
import { clientsApi } from "@/lib/api";
import { teamMembersApi } from "@/lib/team-api";
import { useAuth } from "@/hooks/use-auth";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Plus
} from "lucide-react";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Consultation", duration: 30 },
  { value: "meeting", label: "Business Meeting", duration: 60 },
  { value: "demo", label: "Product Demo", duration: 45 },
  { value: "follow-up", label: "Follow-up", duration: 30 },
  { value: "strategy", label: "Strategy Session", duration: 90 }
];

interface BookingSystemProps {
  onClose?: () => void;
}

export default function BookingSystem({ onClose }: BookingSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [bookingData, setBookingData] = useState({
    title: "",
    description: "",
    clientId: null as number | null,
    assignedToId: null as number | null,
    location: ""
  });

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

  const bookAppointmentMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully scheduled.",
      });
      setStep(4); // Success step
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isTimeSlotAvailable = (date: Date, time: string) => {
    const appointmentDateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    return !appointments.some(apt => {
      const aptDate = new Date(apt.date);
      const aptTime = apt.startTime;
      return isSameDay(aptDate, date) && aptTime === time;
    });
  };

  const getAvailableSlots = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return [];
    
    return TIME_SLOTS.filter(time => isTimeSlotAvailable(date, time));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime("");
    setStep(2);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleBooking = () => {
    const selectedAppointmentType = APPOINTMENT_TYPES.find(type => type.value === selectedType);
    const endTime = selectedTime ? 
      `${String(Number(selectedTime.split(':')[0]) + Math.floor((selectedAppointmentType?.duration || 60) / 60)).padStart(2, '0')}:${String((Number(selectedTime.split(':')[1]) + (selectedAppointmentType?.duration || 60) % 60) % 60).padStart(2, '0')}` 
      : "";

    bookAppointmentMutation.mutate({
      title: bookingData.title,
      description: bookingData.description,
      clientId: bookingData.clientId,
      assignedToId: bookingData.assignedToId,
      date: selectedDate,
      startTime: selectedTime,
      endTime: endTime,
      type: selectedType,
      location: bookingData.location,
      status: "scheduled",
      userId: user?.id || 0
    });
  };

  const renderDatePicker = () => {
    const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Date</h2>
          <p className="text-gray-600">Choose your preferred date</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {days.map((date) => {
            const availableSlots = getAvailableSlots(date);
            const isDisabled = availableSlots.length === 0;
            
            return (
              <Card 
                key={date.toISOString()} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isDisabled ? 'opacity-50' : 'hover:border-primary'
                }`}
                onClick={() => !isDisabled && handleDateSelect(date)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    {format(date, 'EEE')}
                  </div>
                  <div className="text-lg font-bold text-gray-900 mb-2">
                    {format(date, 'd')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(date, 'MMM')}
                  </div>
                  {isToday(date) && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      Today
                    </Badge>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {availableSlots.length} slots
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimeSlots = () => {
    const availableSlots = getAvailableSlots(selectedDate);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Time</h2>
            <p className="text-gray-600">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setStep(1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>
        
        {availableSlots.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Times</h3>
            <p className="text-gray-500">Please select a different date</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableSlots.map((time) => (
              <Button
                key={time}
                variant="outline"
                className="h-12 hover:bg-primary hover:text-white"
                onClick={() => handleTimeSelect(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderBookingForm = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Details</h2>
            <p className="text-gray-600">
              {format(selectedDate, 'EEEE, MMMM d')} at {selectedTime}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setStep(2)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appointment-type">Appointment Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} ({type.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter appointment title"
                value={bookingData.title}
                onChange={(e) => setBookingData({...bookingData, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Select 
                value={bookingData.clientId?.toString() || ""} 
                onValueChange={(value) => setBookingData({...bookingData, clientId: value ? parseInt(value) : null})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name} - {client.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {user?.role === 'admin' && teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign to Team Member</Label>
                <Select 
                  value={bookingData.assignedToId?.toString() || ""} 
                  onValueChange={(value) => setBookingData({...bookingData, assignedToId: value ? parseInt(value) : null})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter location or meeting link"
                value={bookingData.location}
                onChange={(e) => setBookingData({...bookingData, location: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add any additional details..."
                value={bookingData.description}
                onChange={(e) => setBookingData({...bookingData, description: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button 
                onClick={handleBooking}
                disabled={!selectedType || !bookingData.title || bookAppointmentMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {bookAppointmentMutation.isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSuccess = () => {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600">
            Your appointment has been successfully scheduled for {format(selectedDate, 'EEEE, MMMM d')} at {selectedTime}
          </p>
        </div>
        <div className="flex justify-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => {
              setStep(1);
              setSelectedDate(new Date());
              setSelectedTime("");
              setSelectedType("");
              setBookingData({
                title: "",
                description: "",
                clientId: null,
                assignedToId: null,
                location: ""
              });
            }}
          >
            Book Another
          </Button>
          <Button 
            onClick={onClose}
            className="bg-primary hover:bg-primary/90"
          >
            Done
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          {onClose && (
            <Button variant="ghost" onClick={onClose} size="sm">
              ×
            </Button>
          )}
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center space-x-4 mb-8">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= stepNum ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step > stepNum ? 'bg-primary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {step === 1 && renderDatePicker()}
      {step === 2 && renderTimeSlots()}
      {step === 3 && renderBookingForm()}
      {step === 4 && renderSuccess()}
    </div>
  );
}