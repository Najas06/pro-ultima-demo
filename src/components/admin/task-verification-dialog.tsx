'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, ZoomIn, Clock, CheckCircle2, X, FileCheck2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '@/types';
import type { TaskUpdateProof } from '@/types/cashbook';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTasks } from '@/hooks/use-tasks';
import { createClient } from '@/lib/supabase/client';

interface TaskVerificationDialogProps {
  task: Task;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskVerificationDialog({ task, isOpen, onOpenChange }: TaskVerificationDialogProps) {
  const { user } = useAuth();
  const { proofs } = useTaskProofs(task.id);
  const { approveTask, rejectTask } = useTasks();
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedProof, setSelectedProof] = useState<TaskUpdateProof | null>(null);
  const supabase = createClient();

  // Group proofs by status
  const { pendingProofs, verifiedProofs, rejectedProofs } = useMemo(() => {
    const taskProofs = proofs.filter(proof => proof.task_id === task.id);
    return {
      pendingProofs: taskProofs.filter(proof => proof.is_verified === null),
      verifiedProofs: taskProofs.filter(proof => proof.is_verified === true),
      rejectedProofs: taskProofs.filter(proof => proof.is_verified === false),
    };
  }, [proofs, task.id]);

  const handleApproveTask = async () => {
    approveTask(task.id);
    
    // Send email notification to assigned staff
    if (task.assigned_staff_ids && task.assigned_staff_ids.length > 0) {
      try {
        const { data: staffData } = await supabase
          .from('staff')
          .select('email, name')
          .in('id', task.assigned_staff_ids);

        if (staffData && staffData.length > 0) {
          for (const staff of staffData) {
            await fetch('/api/email/send-task-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskId: task.id,
                staffEmail: staff.email,
                staffName: staff.name,
                type: 'approval',
                approvedBy: user?.name,
              }),
            });
          }
        }
      } catch (error) {
        console.error('Email notification failed:', error);
        // Don't fail the whole operation if email fails
      }
    }
    
    toast.success('Task approved successfully!');
    onOpenChange(false);
  };

  const handleRejectTask = async () => {
    rejectTask(task.id);
    
    // Send email notification to assigned staff
    if (task.assigned_staff_ids && task.assigned_staff_ids.length > 0) {
      try {
        const { data: staffData } = await supabase
          .from('staff')
          .select('email, name')
          .in('id', task.assigned_staff_ids);

        if (staffData && staffData.length > 0) {
          for (const staff of staffData) {
            await fetch('/api/email/send-task-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskId: task.id,
                staffEmail: staff.email,
                staffName: staff.name,
                type: 'rejection',
                rejectedBy: user?.name,
              }),
            });
          }
        }
      } catch (error) {
        console.error('Email notification failed:', error);
        // Don't fail the whole operation if email fails
      }
    }
    
    toast.success('Task rejected! Status changed to "In Progress" and staff notified.');
    onOpenChange(false);
  };

  const getStatusBadge = (proof: TaskUpdateProof) => {
    if (proof.is_verified === null) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    } else if (proof.is_verified) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      );
    }
  };

  const renderProofCard = (proof: TaskUpdateProof) => (
    <Card key={proof.id} className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {(proof.staff?.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-medium">{proof.staff?.name || 'Unknown Staff'}</CardTitle>
              <CardDescription className="text-xs">
                {format(new Date(proof.created_at), 'PPp')}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(proof)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Clean image container */}
        <div className="relative rounded-lg border bg-muted/30 overflow-hidden group">
          <img
            src={proof.proof_image_url}
            alt="Task proof"
            className="w-full h-48 object-contain cursor-pointer"
            onClick={() => {
              setSelectedProof(proof);
              setShowFullImage(true);
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => {
              setSelectedProof(proof);
              setShowFullImage(true);
            }}
          >
            <ZoomIn className="h-4 w-4 mr-2" />
            View
          </Button>
        </div>
        
        {/* Clean notes section */}
        {proof.notes && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <Label className="text-sm font-medium mb-2 block">Staff Notes</Label>
            <p className="text-sm text-muted-foreground">{proof.notes}</p>
          </div>
        )}

        {/* Verification Details */}
        {proof.is_verified !== null && (
          <div className="rounded-lg border bg-muted/30 p-3">
            <Label className="text-sm font-medium mb-2 block">Verification Details</Label>
            <div className="flex items-center gap-2">
              {proof.is_verified ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">
                {proof.is_verified ? 'Verified' : 'Rejected'} by {proof.admin?.name || 'Admin'}
              </span>
            </div>
            {proof.verified_at && (
              <p className="text-xs text-muted-foreground mt-1">
                On {format(new Date(proof.verified_at), 'PPp')}
              </p>
            )}
            {proof.verification_notes && (
              <div className="mt-2 p-2 bg-background rounded border">
                <p className="text-xs text-muted-foreground">{proof.verification_notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-[92vw] max-h-[88vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-2 border-b">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 rounded-lg bg-primary/10">
                <FileCheck2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-semibold">Task Verification</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Review proofs for: <span className="font-medium text-foreground">{task.title}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="pending" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pending
                  {pendingProofs.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{pendingProofs.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="verified" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verified
                  {verifiedProofs.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{verifiedProofs.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="rejected" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  <X className="h-4 w-4 mr-2" />
                  Rejected
                  {rejectedProofs.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{rejectedProofs.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 mt-6 px-6">
                {pendingProofs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Clock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">No Pending Proofs</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      All proofs have been reviewed or no proofs have been submitted yet.
                    </p>
                  </div>
                ) : (
                  pendingProofs.map(proof => renderProofCard(proof))
                )}
              </TabsContent>

              <TabsContent value="verified" className="space-y-4 mt-6 px-6">
                {verifiedProofs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">No Verified Proofs</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      No proofs have been verified yet.
                    </p>
                  </div>
                ) : (
                  verifiedProofs.map(proof => renderProofCard(proof))
                )}
              </TabsContent>

              <TabsContent value="rejected" className="space-y-4 mt-6 px-6">
                {rejectedProofs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <X className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">No Rejected Proofs</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      No proofs have been rejected yet.
                    </p>
                  </div>
                ) : (
                  rejectedProofs.map(proof => renderProofCard(proof))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Task Approval/Rejection Actions */}
          {task.status === 'completed' && (
            <>
              <Separator  />
              <div className="px-6 ">
                <div className="rounded-lg border bg-card p-6">
                  <div className="space-y-4">
                   
                    
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        variant="destructive"
                        onClick={handleRejectTask}
                        className="flex-1 sm:flex-initial"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject & Return to Staff
                      </Button>
                      <Button
                        onClick={handleApproveTask}
                        className="flex-1 sm:flex-initial"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Task
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Full size image modal */}
      {showFullImage && selectedProof && (
        <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            <div className="relative">
              <img
                src={selectedProof.proof_image_url}
                alt="Task proof - full size"
                className="w-full h-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}


