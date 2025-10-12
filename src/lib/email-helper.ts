import { sendTaskAssignmentEmail, sendTaskUpdateEmail, sendTaskDelegationEmail } from './email';
import type { Task } from '@/types';

interface NotifyTaskChangeOptions {
  type: 'create' | 'update' | 'delete' | 'reassign' | 'delegate';
  task: Task;
  staffEmails: string[];
  staffNames: string[];
  additionalInfo?: { 
    delegatedBy?: string; 
    changes?: Partial<Task>;
    oldAssigneeEmail?: string;
  };
}

/**
 * Centralized email notification system for all task operations
 */
export async function notifyTaskChange({
  type,
  task,
  staffEmails,
  staffNames,
  additionalInfo
}: NotifyTaskChangeOptions) {
  try {
    switch (type) {
      case 'create':
      case 'reassign':
        // Send assignment emails to all assigned staff
        for (let i = 0; i < staffEmails.length; i++) {
          await sendTaskAssignmentEmail(
            task,
            staffEmails[i],
            staffNames[i]
          );
        }
        break;

      case 'update':
        // Send update emails to all assigned staff
        for (let i = 0; i < staffEmails.length; i++) {
          await sendTaskUpdateEmail(
            task,
            staffEmails[i],
            staffNames[i],
            additionalInfo?.changes || {}
          );
        }
        break;

      case 'delegate':
        // Send delegation emails
        if (additionalInfo?.delegatedBy) {
          for (let i = 0; i < staffEmails.length; i++) {
            await sendTaskDelegationEmail(
              task,
              staffEmails[i],
              staffNames[i],
              additionalInfo.delegatedBy
            );
          }
        }
        break;

      case 'delete':
        // Task deletion notifications could be added here if needed
        console.log('Task deleted - email notifications not implemented');
        break;

      default:
        console.warn('Unknown task change type:', type);
    }
  } catch (error) {
    console.error('Error sending task change notifications:', error);
    // Don't throw - email failures shouldn't break the operation
  }
}

/**
 * Send admin notification about task delegation
 */
export async function notifyAdminDelegation(
  task: Task,
  delegatedBy: string,
  adminEmail: string
) {
  try {
    // This will be implemented in the email.ts file
    console.log('Admin delegation notification:', {
      task: task.title,
      delegatedBy,
      adminEmail
    });
  } catch (error) {
    console.error('Error sending admin delegation notification:', error);
  }
}
