import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { teamMembersApi } from "@/lib/team-api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Plus, 
  Mail, 
  Building,
  Shield,
  Edit,
  Trash2
} from "lucide-react";
import AddTeamMemberModal from "@/components/modals/add-team-member-modal";

export default function TeamMembers() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Fetch users as team members since they are the same thing
  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  // Also fetch team members data for those with additional team info
  const { data: teamMembers = [], isLoading: teamLoading } = useQuery({
    queryKey: ["/api/team-members"],
    queryFn: teamMembersApi.getAll,
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isLoading = usersLoading || teamLoading;

  // Combine users and team members - users are the primary source
  const allTeamMembers = users.map(user => {
    // Find matching team member data if exists
    const teamMemberData = teamMembers.find(tm => tm.email === user.email);
    return {
      id: user.id,
      name: user.username,
      email: user.email,
      role: teamMemberData?.role || user.role || 'User',
      department: teamMemberData?.department || 'General',
      isActive: true, // Users are always active
      phone: teamMemberData?.phone || '',
      joinDate: user.createdAt,
      isUser: true, // Mark as user account
    };
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
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

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600">All system users with their roles and access levels</p>
            {user?.role === 'super_admin' && (
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white mt-2">
                Super Admin Access
              </Badge>
            )}
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allTeamMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          member.role === 'CEO' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          member.role === 'Financial Advisor' ? 'bg-green-100 text-green-700 border-green-200' :
                          member.role === 'Admin' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          member.role === 'IT' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant={member.isActive ? "default" : "secondary"}>
                      {member.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{member.email}</span>
                  </div>
                  {member.department && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{member.department}</span>
                    </div>
                  )}
                  
                  {isAdmin && (
                    <div className="flex items-center space-x-2 pt-3 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {teamMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
            <p className="text-gray-500 mb-4">
              {isAdmin 
                ? "Add your first team member to start assigning appointments" 
                : "Team members will appear here once added by an administrator"
              }
            </p>
            {isAdmin && (
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </div>
        )}
      </div>

      <AddTeamMemberModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </>
  );
}