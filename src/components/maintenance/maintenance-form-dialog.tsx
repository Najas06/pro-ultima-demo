'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useStaff } from '@/hooks/use-staff';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MultipleImageUpload } from '@/components/cashbook/multiple-image-upload';
import { useTaskProofs } from '@/hooks/use-task-proofs';
import type { MaintenanceRequest, MaintenanceFormData, MaintenanceCondition, MaintenanceRunningStatus } from '@/types/maintenance';
import { format } from 'date-fns';

interface MaintenanceFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MaintenanceFormData & { staff_id: string }) => void;
  initialData?: MaintenanceRequest | null;
  isSubmitting?: boolean;
}

export function MaintenanceFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  initialData,
  isSubmitting = false,
}: MaintenanceFormDialogProps) {
  const { user } = useAuth();
  const { staff } = useStaff();
  const currentStaff = staff.find(s => s.id === user?.staffId);
  const { uploadReceiptImage } = useTaskProofs();
  
  // Date states for DatePicker components
  const [reportMonth, setReportMonth] = useState<Date>(new Date());
  const [dateOfPurchase, setDateOfPurchase] = useState<Date>();
  const [warrantyStartDate, setWarrantyStartDate] = useState<Date>();
  const [warrantyEndDate, setWarrantyEndDate] = useState<Date>();
  
  // File upload states
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<MaintenanceFormData>({
    serial_number: '',
    workstation_number: '',
    brand_name: '',
    report_month: format(new Date(), 'yyyy-MM'),
    date_of_purchase: '',
    warranty_start_date: '',
    warranty_end_date: '',
    condition: 'new',
    running_status: 'running',
    branch: currentStaff?.branch || '',
  });

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        serial_number: initialData.serial_number || '',
        workstation_number: initialData.workstation_number || '',
        brand_name: initialData.brand_name || '',
        report_month: initialData.report_month || format(new Date(), 'yyyy-MM'),
        date_of_purchase: initialData.date_of_purchase || '',
        warranty_start_date: initialData.warranty_start_date || '',
        warranty_end_date: initialData.warranty_end_date || '',
        condition: initialData.condition,
        running_status: initialData.running_status,
        branch: initialData.branch,
      });
      
      // Set date states for DatePicker components
      setReportMonth(initialData.report_month ? new Date(initialData.report_month) : new Date());
      setDateOfPurchase(initialData.date_of_purchase ? new Date(initialData.date_of_purchase) : undefined);
      setWarrantyStartDate(initialData.warranty_start_date ? new Date(initialData.warranty_start_date) : undefined);
      setWarrantyEndDate(initialData.warranty_end_date ? new Date(initialData.warranty_end_date) : undefined);
    } else {
      // Reset form for new request
      setFormData({
        serial_number: '',
        workstation_number: '',
        brand_name: '',
        report_month: format(new Date(), 'yyyy-MM'),
        date_of_purchase: '',
        warranty_start_date: '',
        warranty_end_date: '',
        condition: 'new',
        running_status: 'running',
        branch: currentStaff?.branch || '',
      });
      
      // Reset date states
      setReportMonth(new Date());
      setDateOfPurchase(undefined);
      setWarrantyStartDate(undefined);
      setWarrantyEndDate(undefined);
    }
  }, [initialData, currentStaff?.branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.staffId) {
      return;
    }

    // Convert Date objects to string format for database
    const reportMonthFormatted = format(reportMonth, "yyyy-MM-01");
    const dateOfPurchaseFormatted = dateOfPurchase ? format(dateOfPurchase, "yyyy-MM-dd") : undefined;
    const warrantyStartFormatted = warrantyStartDate ? format(warrantyStartDate, "yyyy-MM-dd") : undefined;
    const warrantyEndFormatted = warrantyEndDate ? format(warrantyEndDate, "yyyy-MM-dd") : undefined;

    // Upload attachments if provided
    let attachmentUrls: string[] = [];
    if (attachmentFiles.length > 0) {
      setUploading(true);
      try {
        attachmentUrls = await Promise.all(
          attachmentFiles.map(file => uploadReceiptImage(file, `maintenance-${Date.now()}`))
        );
      } catch (error) {
        console.error('Error uploading files:', error);
        toast.error('Failed to upload some files');
      }
      setUploading(false);
    }

    onSubmit({
      ...formData,
      report_month: reportMonthFormatted,
      date_of_purchase: dateOfPurchaseFormatted,
      warranty_start_date: warrantyStartFormatted,
      warranty_end_date: warrantyEndFormatted,
      attachment_urls: attachmentUrls.length > 0 ? attachmentUrls : undefined,
      staff_id: user.staffId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New System Record</DialogTitle>
          <DialogDescription>
            Record system performance details for monthly maintenance tracking
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Report Month */}
              <div className="space-y-2">
                <Label>Report Month</Label>
                <DatePicker
                  date={reportMonth}
                  onSelect={(date) => date && setReportMonth(date)}
                  placeholder="Select month"
                />
              </div>

              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand Name</Label>
                <Input
                  id="brand_name"
                  type="text"
                  placeholder="e.g., Dell, HP, Lenovo"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                />
              </div>

              {/* Date of Purchase */}
              <div className="space-y-2">
                <Label>Date of Purchase</Label>
                <DatePicker
                  date={dateOfPurchase}
                  onSelect={setDateOfPurchase}
                  placeholder="Select purchase date"
                />
              </div>

              {/* Warranty End Date */}
              <div className="space-y-2">
                <Label>Warranty End Date</Label>
                <DatePicker
                  date={warrantyEndDate}
                  onSelect={setWarrantyEndDate}
                  placeholder="Select warranty end date"
                />
              </div>

              {/* Branch / Location */}
              <div className="space-y-2">
                <Label htmlFor="branch">Branch / Location</Label>
                <Input
                  id="branch"
                  type="text"
                  placeholder="e.g., Main Office, Warehouse A, Regional Center"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  required
                />
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label>Condition</Label>
                <RadioGroup
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value as MaintenanceCondition })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="condition-new" />
                    <Label htmlFor="condition-new" className="cursor-pointer">New</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="used" id="condition-used" />
                    <Label htmlFor="condition-used" className="cursor-pointer">Used</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Running Status */}
              <div className="space-y-2">
                <Label>Running Status</Label>
                <RadioGroup
                  value={formData.running_status}
                  onValueChange={(value) => setFormData({ ...formData, running_status: value as MaintenanceRunningStatus })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="running" id="status-running" />
                    <Label htmlFor="status-running" className="cursor-pointer">Running</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_running" id="status-not-running" />
                    <Label htmlFor="status-not-running" className="cursor-pointer">Not Running</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* S.No / Serial Number */}
              <div className="space-y-2">
                <Label htmlFor="serial_number">S.No / Serial Number</Label>
                <Input
                  id="serial_number"
                  type="text"
                  placeholder="e.g., SN-2024-001"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                />
              </div>

              {/* Workstation Number */}
              <div className="space-y-2">
                <Label htmlFor="workstation_number">Workstation Number</Label>
                <Input
                  id="workstation_number"
                  type="text"
                  placeholder="e.g., WS-101, Desk-A5"
                  value={formData.workstation_number}
                  onChange={(e) => setFormData({ ...formData, workstation_number: e.target.value })}
                />
              </div>

              {/* Warranty Start Date */}
              <div className="space-y-2">
                <Label>Warranty Start Date</Label>
                <DatePicker
                  date={warrantyStartDate}
                  onSelect={setWarrantyStartDate}
                  placeholder="Select warranty start date"
                />
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <MultipleImageUpload
            onImagesChange={setAttachmentFiles}
            maxImages={10}
            maxSizeMB={10}
            acceptAllTypes={true}
            label="Attach Files (Any type, max 10MB each)"
          />

          {/* Submit Button */}
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
                  {uploading ? 'Uploading...' : (initialData ? 'Updating...' : 'Submitting...')}
                </>
              ) : (
                initialData ? 'Update Request' : 'Add System Record'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
