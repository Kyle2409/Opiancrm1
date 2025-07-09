import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit } from "lucide-react";
import type { Client } from "@shared/schema";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export default function EditClientModal({
  isOpen,
  onClose,
  client,
}: EditClientModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    email: "",
    cellPhone: "",
    employer: "",
    occupation: "",
    status: "active",
    value: "",
    physicalAddress: "",
    monthlyIncome: "",
    grossAnnualIncome: "",
    maritalStatus: "",
    smokerStatus: false,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Populate form when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || "",
        surname: client.surname || "",
        email: client.email || "",
        cellPhone: client.cellPhone || "",
        employer: client.employer || "",
        occupation: client.occupation || "",
        status: client.status || "active",
        value: client.value?.toString() || "",
        physicalAddress: client.physicalAddress || "",
        monthlyIncome: client.monthlyIncome?.toString() || "",
        grossAnnualIncome: client.grossAnnualIncome?.toString() || "",
        maritalStatus: client.maritalStatus || "",
        smokerStatus: client.smokerStatus || false,
      });
    }
  }, [client]);

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Client updated successfully!",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client || !formData.firstName || !formData.surname || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const updateData = {
      firstName: formData.firstName,
      surname: formData.surname,
      email: formData.email,
      cellPhone: formData.cellPhone || null,
      employer: formData.employer || null,
      occupation: formData.occupation || null,
      status: formData.status,
      value: formData.value ? parseInt(formData.value) : null,
      physicalAddress: formData.physicalAddress || null,
      monthlyIncome: formData.monthlyIncome ? parseInt(formData.monthlyIncome) : null,
      grossAnnualIncome: formData.grossAnnualIncome ? parseInt(formData.grossAnnualIncome) : null,
      maritalStatus: formData.maritalStatus || null,
      smokerStatus: formData.smokerStatus,
    };

    updateClientMutation.mutate({ id: client.id, data: updateData });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="w-5 h-5 text-primary" />
            <span>Edit Client</span>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-textPrimary">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="surname">Surname *</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => handleInputChange("surname", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cellPhone">Cell Phone</Label>
                <Input
                  id="cellPhone"
                  value={formData.cellPhone}
                  onChange={(e) => handleInputChange("cellPhone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maritalStatus">Marital Status</Label>
                <Select 
                  value={formData.maritalStatus} 
                  onValueChange={(value) => handleInputChange("maritalStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="smokerStatus"
                  checked={formData.smokerStatus}
                  onChange={(e) => handleInputChange("smokerStatus", e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="smokerStatus">Smoker</Label>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-textPrimary">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employer">Employer</Label>
                <Input
                  id="employer"
                  value={formData.employer}
                  onChange={(e) => handleInputChange("employer", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange("occupation", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthlyIncome">Monthly Income</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="grossAnnualIncome">Gross Annual Income</Label>
                <Input
                  id="grossAnnualIncome"
                  type="number"
                  value={formData.grossAnnualIncome}
                  onChange={(e) => handleInputChange("grossAnnualIncome", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* CRM Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-textPrimary">CRM Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">Client Value</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleInputChange("value", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-textPrimary">Address Information</h3>
            <div>
              <Label htmlFor="physicalAddress">Physical Address</Label>
              <Textarea
                id="physicalAddress"
                value={formData.physicalAddress}
                onChange={(e) => handleInputChange("physicalAddress", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateClientMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {updateClientMutation.isPending ? "Updating..." : "Update Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}