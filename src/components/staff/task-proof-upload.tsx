'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TaskProofUploadProps {
  onImageSelect: (file: File) => void;
  onNotesChange: (notes: string) => void;
  isUploading?: boolean;
}

export function TaskProofUpload({ onImageSelect, onNotesChange, isUploading }: TaskProofUploadProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, or WEBP)');
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedImage(file);
    onImageSelect(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onNotesChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Proof Image *</Label>
        <div className="border-2 border-dashed rounded-lg p-6">
          {!imagePreview ? (
            <div className="text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
                id="proof-image-input"
              />
              <label
                htmlFor="proof-image-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Click to upload proof image</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG or WEBP (max 2MB)</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Proof preview"
                className="w-full h-64 object-contain rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <ImageIcon className="h-4 w-4" />
                <span>{selectedImage?.name}</span>
                <span className="text-muted-foreground">
                  ({(selectedImage!.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a clear photo showing proof of task completion
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proof-notes">Notes (Optional)</Label>
        <Textarea
          id="proof-notes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add any additional notes about this update..."
          rows={3}
          disabled={isUploading}
        />
      </div>

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading proof image...</span>
        </div>
      )}
    </div>
  );
}


