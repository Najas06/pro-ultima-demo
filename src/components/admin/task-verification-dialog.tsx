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
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2, ZoomIn, Clock, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Task } from '@/types';
import type { TaskUpdateProof } from '@/types/cashbook';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TaskVerificationDialogProps {
  task: Task;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskVerificationDialog({ task, isOpen, onOpenChange }: TaskVerificationDialogProps) {
  const { user } = useAuth();
  const { proofs, verifyProof, isVerifying } = useTaskProofs(task.id);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);
  const [selectedProof, setSelectedProof] = useState<TaskUpdateProof | null>(null);

  // Group proofs by status
  const { pendingProofs, verifiedProofs, rejectedProofs } = useMemo(() => {
    const taskProofs = proofs.filter(proof => proof.task_id === task.id);
    return {
      pendingProofs: taskProofs.filter(proof => proof.is_verified === null),
      verifiedProofs: taskProofs.filter(proof => proof.is_verified === true),
      rejectedProofs: taskProofs.filter(proof => proof.is_verified === false),
    };
  }, [proofs, task.id]);

  const handleVerify = (proof: TaskUpdateProof, isVerified: boolean) => {
    if (!user?.id) {
      toast.error('Admin not authenticated');
      return;
    }

    verifyProof({
      id: proof.id,
      is_verified: isVerified,
      verified_by: user.id,
      verification_notes: verificationNotes || undefined,
    });

    setVerificationNotes('');
  };

  const getStatusBadge = (proof: TaskUpdateProof) => {
    if (proof.is_verified === null) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    } else if (proof.is_verified) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>;
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
  };

  const renderProofCard = (proof: TaskUpdateProof, showActions = false) => (
    <Card key={proof.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">{proof.staff?.name || 'Unknown Staff'}</CardTitle>
            <CardDescription className="text-xs">
              {format(new Date(proof.created_at), 'PPp')} • Status: {proof.status.replace('_', ' ')}
            </CardDescription>
          </div>
          {getStatusBadge(proof)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Proof Image */}
        <div className="relative border rounded-lg overflow-hidden bg-black">
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
            className="absolute bottom-2 right-2"
            onClick={() => {
              setSelectedProof(proof);
              setShowFullImage(true);
            }}
          >
            <ZoomIn className="mr-2 h-4 w-4" />
            View Full Size
          </Button>
        </div>

        {/* Staff Notes */}
        {proof.notes && (
          <div className="space-y-2">
            <Label className="text-sm">Staff Notes</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{proof.notes}</p>
            </div>
          </div>
        )}

        {/* Verification Details */}
        {proof.is_verified !== null && (
          <div className="space-y-2">
            <Label className="text-sm">Verification Details</Label>
            <div className="p-3 border rounded-lg space-y-2">
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
                <p className="text-xs text-muted-foreground">
                  On {format(new Date(proof.verified_at), 'PPp')}
                </p>
              )}
              {proof.verification_notes && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="text-xs">{proof.verification_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Actions (only for pending proofs) */}
        {showActions && proof.is_verified === null && (
          <div className="space-y-3 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="verification_notes" className="text-sm">Verification Notes (Optional)</Label>
              <Textarea
                id="verification_notes"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add any comments about this verification..."
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleVerify(proof, false)}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleVerify(proof, true)}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Verify
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Proof Verification</DialogTitle>
            <DialogDescription>
              Review and verify proof images for task: "{task.title}"
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingProofs.length})
              </TabsTrigger>
              <TabsTrigger value="verified" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Verified ({verifiedProofs.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Rejected ({rejectedProofs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingProofs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending proofs to review
                </div>
              ) : (
                pendingProofs.map(proof => renderProofCard(proof, true))
              )}
            </TabsContent>

            <TabsContent value="verified" className="space-y-4">
              {verifiedProofs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No verified proofs yet
                </div>
              ) : (
                verifiedProofs.map(proof => renderProofCard(proof, false))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedProofs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rejected proofs
                </div>
              ) : (
                rejectedProofs.map(proof => renderProofCard(proof, false))
              )}
            </TabsContent>
          </Tabs>
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


