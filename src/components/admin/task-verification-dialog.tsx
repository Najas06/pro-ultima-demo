'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import type { TaskUpdateProof } from '@/types/cashbook';
import { format } from 'date-fns';

interface TaskVerificationDialogProps {
  proof: TaskUpdateProof;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskVerificationDialog({ proof, open, onOpenChange }: TaskVerificationDialogProps) {
  const { user } = useAuth();
  const { verifyProof, isVerifying } = useTaskProofs();
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showFullImage, setShowFullImage] = useState(false);

  const handleVerify = (isVerified: boolean) => {
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

    onOpenChange(false);
    setVerificationNotes('');
  };

  const getStatusBadge = () => {
    if (proof.is_verified === null) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Pending</span>;
    } else if (proof.is_verified) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Verified</span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Rejected</span>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Update Proof Verification</DialogTitle>
            <DialogDescription>
              Review and verify the proof image submitted by staff
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Proof Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                <p className="font-medium">{proof.staff?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status Changed To</p>
                <p className="font-medium capitalize">{proof.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
                <p className="font-medium">{format(new Date(proof.created_at), 'PPp')}</p>
              </div>
            </div>

            {/* Proof Image */}
            <div className="space-y-2">
              <Label>Proof Image</Label>
              <div className="relative border rounded-lg overflow-hidden bg-black">
                <img
                  src={proof.proof_image_url}
                  alt="Task proof"
                  className="w-full h-96 object-contain cursor-pointer"
                  onClick={() => setShowFullImage(true)}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-4 right-4"
                  onClick={() => setShowFullImage(true)}
                >
                  <ZoomIn className="mr-2 h-4 w-4" />
                  View Full Size
                </Button>
              </div>
            </div>

            {/* Staff Notes */}
            {proof.notes && (
              <div className="space-y-2">
                <Label>Staff Notes</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{proof.notes}</p>
                </div>
              </div>
            )}

            {/* Verification Status */}
            {proof.is_verified !== null && (
              <div className="space-y-2">
                <Label>Verification Details</Label>
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    {proof.is_verified ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {proof.is_verified ? 'Verified' : 'Rejected'} by {proof.admin?.name || 'Admin'}
                    </span>
                  </div>
                  {proof.verified_at && (
                    <p className="text-sm text-muted-foreground">
                      On {format(new Date(proof.verified_at), 'PPp')}
                    </p>
                  )}
                  {proof.verification_notes && (
                    <div className="mt-2 p-2 bg-muted rounded">
                      <p className="text-sm">{proof.verification_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Verification Form (only for pending proofs) */}
            {proof.is_verified === null && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification_notes">Verification Notes (Optional)</Label>
                  <Textarea
                    id="verification_notes"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add any comments about this verification..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleVerify(false)}
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
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleVerify(true)}
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Full size image modal */}
      {showFullImage && (
        <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
            <div className="relative">
              <img
                src={proof.proof_image_url}
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


