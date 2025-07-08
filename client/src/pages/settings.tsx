import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Check, X, Settings as SettingsIcon } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Settings() {
  const { 
    isSupported, 
    permission, 
    isInitialized, 
    requestPermission,
    showNotification 
  } = useNotifications();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    appointmentReminders: true,
    newAppointments: true,
    clientUpdates: true,
    systemNotifications: true
  });

  const handlePermissionRequest = async () => {
    const newPermission = await requestPermission();
    if (newPermission === 'granted') {
      toast({
        title: "Notifications Enabled",
        description: "You will now receive push notifications for important updates.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings to receive alerts.",
        variant: "destructive"
      });
    }
  };

  const handleTestNotification = () => {
    if (permission === 'granted') {
      showNotification({
        title: 'Test Notification',
        body: 'This is a test notification from Opian Core!',
        type: 'system'
      });
      toast({
        title: "Test Sent",
        description: "Check for the notification popup!",
      });
    } else {
      toast({
        title: "Permission Required",
        description: "Please enable notifications first.",
        variant: "destructive"
      });
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline">Not Set</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage your account preferences and notification settings</p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications from Opian Core
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Browser Support</Label>
                  <p className="text-sm text-gray-600">
                    {isSupported ? "Your browser supports notifications" : "Your browser doesn't support notifications"}
                  </p>
                </div>
                <Badge variant={isSupported ? "default" : "secondary"}>
                  {isSupported ? "Supported" : "Not Supported"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Permission Status</Label>
                  <p className="text-sm text-gray-600">Current notification permission</p>
                </div>
                {getPermissionBadge()}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Service Status</Label>
                  <p className="text-sm text-gray-600">Notification service initialization</p>
                </div>
                <Badge variant={isInitialized ? "default" : "secondary"}>
                  {isInitialized ? "Ready" : "Loading"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handlePermissionRequest}
                  disabled={!isSupported || permission === 'granted'}
                  className="flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Enable Notifications
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleTestNotification}
                  disabled={!isSupported || permission !== 'granted'}
                  className="flex items-center gap-2"
                >
                  <BellOff className="w-4 h-4" />
                  Send Test
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose which types of notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Appointment Reminders</Label>
                  <p className="text-sm text-gray-600">Get notified 1 hour before appointments</p>
                </div>
                <Switch
                  checked={settings.appointmentReminders}
                  onCheckedChange={(checked) => setSettings({...settings, appointmentReminders: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">New Appointments</Label>
                  <p className="text-sm text-gray-600">Get notified when new appointments are scheduled</p>
                </div>
                <Switch
                  checked={settings.newAppointments}
                  onCheckedChange={(checked) => setSettings({...settings, newAppointments: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Client Updates</Label>
                  <p className="text-sm text-gray-600">Get notified about client-related changes</p>
                </div>
                <Switch
                  checked={settings.clientUpdates}
                  onCheckedChange={(checked) => setSettings({...settings, clientUpdates: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">System Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified about system updates and maintenance</p>
                </div>
                <Switch
                  checked={settings.systemNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, systemNotifications: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure your general preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">General settings will be available in future updates.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Account settings will be available in future updates.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}