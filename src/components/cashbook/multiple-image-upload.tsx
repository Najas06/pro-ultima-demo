'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Eye, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MultipleImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxImages?: number; // default 10
  maxSizeMB?: number; // default 10
  className?: string;
  acceptAllTypes?: boolean; // If true, accept all file types instead of just images
  label?: string; // Custom label text
}

interface ImagePreview {
  file: File;
  preview: string;
  size: string;
}

export function MultipleImageUpload({ 
  onImagesChange, 
  maxImages = 10, 
  maxSizeMB = 10,
  className,
  acceptAllTypes = false,
  label = "Receipt/Bill Images (Optional)"
}: MultipleImageUploadProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImages = (files: File[]): { valid: File[], errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    files.forEach((file, index) => {
      // Type validation - skip if acceptAllTypes is true
      if (!acceptAllTypes && !allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid type (${file.type}). Only JPG, PNG, WEBP allowed.`);
        return;
      }
      
      // Size validation
      if (file.size > maxSizeBytes) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        errors.push(`File ${index + 1}: Too large (${sizeMB}MB). Max ${maxSizeMB}MB allowed.`);
        return;
      }
      
      valid.push(file);
    });

    return { valid, errors };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);
    
    // Check total count limit
    if (images.length + fileArray.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed. You can add ${maxImages - images.length} more.`);
      return;
    }

    const { valid, errors } = validateImages(fileArray);

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (valid.length > 0) {
      const newImages: ImagePreview[] = valid.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        size: formatFileSize(file.size)
      }));

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange(updatedImages.map(img => img.file));
      
      if (valid.length > 0) {
        toast.success(`${valid.length} image(s) added successfully`);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages.map(img => img.file));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label>{label}</Label>
      
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-1">
          Click to upload or drag and drop {acceptAllTypes ? 'files' : 'images'} here
        </p>
        <p className="text-xs text-muted-foreground">
          Max {maxImages} {acceptAllTypes ? 'files' : 'images'}, {maxSizeMB}MB each {!acceptAllTypes && '(JPG, PNG, WEBP)'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptAllTypes ? "*/*" : "image/jpeg,image/jpg,image/png,image/webp"}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Selected Images ({images.length}/{maxImages})</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setImages([]);
                onImagesChange([]);
              }}
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <Card key={index} className="relative group overflow-hidden">
                {/* Image Preview */}
                <div className="relative h-32 bg-muted">
                  <img
                    src={image.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  
                  {/* Remove Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Image Info */}
                <div className="p-2 space-y-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {image.file.name}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {image.size}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Validation Info */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <div>
          <p>• Maximum {maxImages} {acceptAllTypes ? 'files' : 'images'} allowed</p>
          <p>• Each {acceptAllTypes ? 'file' : 'image'} must be ≤{maxSizeMB}MB</p>
          {!acceptAllTypes && <p>• Supported formats: JPG, PNG, WEBP</p>}
          {acceptAllTypes && <p>• All file types accepted (images, documents, ZIP, etc.)</p>}
        </div>
      </div>
    </div>
  );
}

