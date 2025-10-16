"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  FileText, 
  Download,
  ExternalLink,
  Image as ImageIcon,
  FileIcon,
  CheckCircle2,
  Paperclip
} from "lucide-react"
import type { Task } from "@/types"

interface StaffTaskDetailsDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StaffTaskDetailsDialog({
  task,
  open,
  onOpenChange,
}: StaffTaskDetailsDialogProps) {
  if (!task) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'todo':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'backlog':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <ImageIcon className="h-5 w-5" />
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className="h-5 w-5 text-red-500" />
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="h-5 w-5 text-blue-500" />
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return <FileText className="h-5 w-5 text-green-500" />
    }
    
    return <FileIcon className="h-5 w-5" />
  }

  const getFileName = (url: string) => {
    const parts = url.split('/')
    const fileName = parts[parts.length - 1]
    // Remove timestamp prefix if present
    return fileName.replace(/^\d+-/, '')
  }

  const isImageFile = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4 space-y-1">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold">{task.title}</DialogTitle>
              <DialogDescription>Complete task information and attachments</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Status & Priority Card */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border">
            <Badge className={`${getStatusColor(task.status)} px-3 py-1.5 text-xs font-semibold`}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {task.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={`${getPriorityColor(task.priority)} px-3 py-1.5 text-xs font-semibold`}>
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
              {task.priority.toUpperCase()}
            </Badge>
            {task.task_no && (
              <Badge variant="outline" className="px-3 py-1.5 text-xs font-mono font-semibold">
                {task.task_no}
              </Badge>
            )}
          </div>

          {/* Description Card */}
          {task.description && (
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">Description</Label>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Dates Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {task.start_date && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <Label className="text-xs font-semibold">Start Date</Label>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(task.start_date), 'PPP')}
                </p>
              </div>
            )}
            {task.due_date && (
              <div className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <Label className="text-xs font-semibold">Due Date</Label>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(task.due_date), 'PPP')}
                </p>
              </div>
            )}
          </div>

          {/* Modern File Attachments Section */}
          {task.support_files && task.support_files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-semibold">
                  Attached Files
                </Label>
                <Badge variant="secondary" className="ml-auto">
                  {task.support_files.length}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1  gap-4">
                {task.support_files.map((fileUrl, index) => (
                  <div key={index} className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all">
                    {/* Image Preview - compact */}
                    {isImageFile(fileUrl) && (
                      <div className="relative h-40 bg-muted overflow-hidden">
                        <img
                          src={fileUrl}
                          alt={getFileName(fileUrl)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                    )}
                    
                    {/* File Info */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getFileIcon(fileUrl)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={getFileName(fileUrl)}>
                            {getFileName(fileUrl)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Attachment {index + 1}
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                            View
                          </a>
                        </Button>
                        <Button variant="secondary" size="sm" className="flex-1" asChild>
                          <a href={fileUrl} download>
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-6 py-4 bg-muted/30">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto sm:ml-auto flex"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

