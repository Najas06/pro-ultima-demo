'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useStaff } from '@/hooks/use-staff';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PurchaseRequisitionFormData } from '@/types/maintenance';

interface PurchaseRequisitionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PurchaseRequisitionFormData & { staff_id: string }) => void;
  isSubmitting?: boolean;
}

export function PurchaseRequisitionDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting = false
}: PurchaseRequisitionDialogProps) {
  const { user } = useAuth();
  const { staff } = useStaff();
  const currentStaff = staff.find(s => s.id === user?.staffId);
  const { uploadReceiptImage } = useTaskProofs();
  
  const [quotationFiles, setQuotationFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: currentStaff?.name || '',
    designation: currentStaff?.role || '',
    department: currentStaff?.department || '',
    branch: currentStaff?.branch || '',
    purchase_item: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.staffId) {
      toast.error('User not authenticated');
      return;
    }

    if (!formData.purchase_item) {
      toast.error('Please enter purchase item');
      return;
    }

    // Upload quotation files if provided
    let quotationUrls: string[] = [];
    if (quotationFiles.length > 0) {
      setUploading(true);
      try {
        quotationUrls = await Promise.all(
          quotationFiles.map(file => uploadReceiptImage(file, `purchase-${Date.now()}`))
        );
      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error('Failed to upload some files');
      }
      setUploading(false);
    }

    onSubmit({
      ...formData,
      quotation_urls: quotationUrls.length > 0 ? quotationUrls : undefined,
      staff_id: user.staffId,
    });

    // Reset form
    setFormData({
      name: currentStaff?.name || '',
      designation: currentStaff?.role || '',
      department: currentStaff?.department || '',
      branch: currentStaff?.branch || '',
      purchase_item: '',
      description: '',
    });
    setQuotationFiles([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buy Product - Purchase Requisition</DialogTitle>
          <DialogDescription>
            Submit a purchase requisition for product procurement
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input 
                id="designation"
                value={formData.designation} 
                onChange={(e) => setFormData({...formData, designation: e.target.value})} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input 
                id="department"
                value={formData.department} 
                onChange={(e) => setFormData({...formData, department: e.target.value})} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input 
                id="branch"
                value={formData.branch} 
                onChange={(e) => setFormData({...formData, branch: e.target.value})} 
                required 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchase_item">Purchase Requisition Item</Label>
            <Input 
              id="purchase_item"
              value={formData.purchase_item} 
              onChange={(e) => setFormData({...formData, purchase_item: e.target.value})} 
              placeholder="e.g., Dell Laptop Model XPS 15, Office Printer, etc." 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              placeholder="Additional details about the purchase requirement..." 
              rows={3}
            />
          </div>
          
          {/* File Upload Section */}
          <MultipleImageUpload
            onImagesChange={setQuotationFiles}
            maxImages={10}
            maxSizeMB={10}
            acceptAllTypes={true}
            label="Attach Quotation Files (Any type, max 10MB each)"
          />
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || uploading}>
              {isSubmitting || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Submitting...'}
                </>
              ) : (
                'Submit Requisition'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

