'use client';

import { useState } from 'react';
import { useAttendance } from '@/hooks/use-attendance';
import { useStaff } from '@/hooks/use-staff';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar,
  Clock,
  Users,
  UserCheck,
  UserX,
  LogOut,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function ReportsContent() {
  const { 
    useTodayAllAttendance, 
    useAttendanceSummary, 
    useAttendanceHistory,
    markLogout,
    isMarkingLogout 
  } = useAttendance();
  
  const { staff: staffData } = useStaff();
  const { data: attendanceRecords, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useTodayAllAttendance();
  const { data: attendanceSummary, isLoading: isLoadingSummary } = useAttendanceSummary();
  
  const [selectedDateRange, setSelectedDateRange] = useState('7');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  const selectedStaff = staffData?.find(s => s.id === selectedStaffId);
  const { data: staffHistory } = useAttendanceHistory(selectedStaffId || undefined, parseInt(selectedDateRange));

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'HH:mm:ss');
  };

  const formatDateTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'MMM dd, HH:mm:ss');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'logged_out':
        return <Badge className="bg-gray-100 text-gray-800">Logged Out</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleManualLogout = async (staffId: string, staffName: string) => {
    try {
      markLogout(staffId);
      toast.success(`Marked ${staffName} as logged out`);
    } catch (error) {
      toast.error('Failed to mark logout');
    }
  };

  const exportToCSV = () => {
    if (!attendanceRecords) return;
    
    const csvContent = [
      ['Name', 'Email', 'Department', 'Login Time', 'Logout Time', 'Status', 'Check-ins'],
      ...attendanceRecords.map(record => [
        record.staff?.name || 'Unknown',
        record.staff?.email || 'N/A',
        record.staff?.department || 'N/A',
        formatTime(record.login_time),
        formatTime(record.logout_time),
        record.status,
        record.check_ins?.length || 0
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Attendance report exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff Reports</h2>
          <p className="text-muted-foreground">
            Monitor staff attendance, login times, and activity reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchAttendance()}
            disabled={isLoadingAttendance}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAttendance ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV}
            disabled={!attendanceRecords?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {attendanceSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceSummary.totalStaff}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{attendanceSummary.present}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logged Out</CardTitle>
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{attendanceSummary.loggedOut}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Attendance</TabsTrigger>
          <TabsTrigger value="history">Individual History</TabsTrigger>
        </TabsList>

        {/* Today's Attendance Tab */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Staff Attendance
              </CardTitle>
              <CardDescription>
                Current login status and times for all staff members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading attendance data...</span>
                </div>
              ) : attendanceRecords && attendanceRecords.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Logout Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-ins</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {record.staff?.profile_image_url && record.staff.profile_image_url.trim() !== '' ? (
                              <img 
                                src={record.staff.profile_image_url} 
                                alt={record.staff.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{record.staff?.name || 'Unknown Staff'}</div>
                              <div className="text-sm text-muted-foreground">{record.staff?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{record.staff?.department || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-green-600" />
                            {formatTime(record.login_time)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.logout_time ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-red-600" />
                              {formatTime(record.logout_time)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Still Active</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.check_ins?.length || 0} times
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.last_activity ? (
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-600" />
                              {formatDateTime(record.last_activity)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManualLogout(record.staff_id, record.staff?.name || 'Staff')}
                              disabled={isMarkingLogout}
                            >
                              <LogOut className="h-4 w-4 mr-1" />
                              Logout
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No attendance records found for today.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Individual History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Individual Attendance History
              </CardTitle>
              <CardDescription>
                View attendance history for specific staff members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffData?.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} ({staff.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedStaff && staffHistory && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold">{selectedStaff.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedStaff.department} • {selectedStaff.email}
                    </p>
                  </div>

                  {staffHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Login Time</TableHead>
                          <TableHead>Logout Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Check-ins</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffHistory.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell>{formatTime(record.login_time)}</TableCell>
                            <TableCell>{formatTime(record.logout_time)}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {record.check_ins?.length || 0} times
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No attendance history found for the selected period.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
