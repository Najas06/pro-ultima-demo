import nodemailer from 'nodemailer';
import type { Task } from '@/types';
import type { MaintenanceRequest } from '@/types/maintenance';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Core email sending function
 */
export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    const transport = getTransporter();
    
    const info = await transport.sendMail({
      from: `ProUltima Task Manager <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send task assignment notification
 */
export async function sendTaskAssignmentEmail(
  task: Task,
  assigneeEmail: string,
  assigneeName: string,
  assignedBy?: string
) {
  const priorityColor = {
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#dc2626',
  }[task.priority] || '#6b7280';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .priority { background-color: ${priorityColor}; color: white; }
          .status { background-color: #e5e7eb; color: #374151; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">New Task Assigned</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You have a new task to work on</p>
          </div>
          <div class="content">
            <p>Hi ${assigneeName},</p>
            <p>${assignedBy ? `<strong>${assignedBy}</strong> has assigned` : 'You have been assigned'} a new task:</p>
            
            <div class="task-card">
              <h2 style="margin-top: 0; color: #111827;">${task.title}</h2>
              ${task.description ? `<p style="color: #6b7280;">${task.description}</p>` : ''}
              
              <div style="margin: 15px 0;">
                <span class="badge priority">${task.priority.toUpperCase()}</span>
                <span class="badge status">${task.status.replace('_', ' ').toUpperCase()}</span>
              </div>
              
              ${task.due_date ? `
                <p style="margin: 10px 0; color: #6b7280;">
                  <strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              ` : ''}
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View Task
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Task Manager.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: assigneeEmail,
    subject: `New Task Assigned: ${task.title}`,
    html,
  });
}

/**
 * Send daily report to admin
 */
export async function sendDailyReport(
  adminEmail: string,
  reportData: {
    totalTasks: number;
    completedToday: number;
    inProgress: number;
    overdue: number;
    teamPerformance: Array<{ teamName: string; completionRate: number }>;
    topPerformers: Array<{ staffName: string; tasksCompleted: number }>;
  }
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-number { font-size: 36px; font-weight: bold; color: #667eea; margin: 10px 0; }
          .stat-label { color: #6b7280; font-size: 14px; }
          .section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .section h3 { margin-top: 0; color: #111827; }
          .list-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .list-item:last-child { border-bottom: none; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Daily Task Report</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <div class="content">
            <h2 style="color: #111827;">Today's Overview</h2>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Tasks</div>
                <div class="stat-number">${reportData.totalTasks}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Completed Today</div>
                <div class="stat-number" style="color: #10b981;">${reportData.completedToday}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">In Progress</div>
                <div class="stat-number" style="color: #f59e0b;">${reportData.inProgress}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Overdue</div>
                <div class="stat-number" style="color: #ef4444;">${reportData.overdue}</div>
              </div>
            </div>
            
            ${reportData.topPerformers.length > 0 ? `
              <div class="section">
                <h3>Top Performers</h3>
                ${reportData.topPerformers.map(performer => `
                  <div class="list-item">
                    <strong>${performer.staffName}</strong>
                    <span style="float: right; color: #10b981;">${performer.tasksCompleted} tasks completed</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${reportData.teamPerformance.length > 0 ? `
              <div class="section">
                <h3>Team Performance</h3>
                ${reportData.teamPerformance.map(team => `
                  <div class="list-item">
                    <strong>${team.teamName}</strong>
                    <span style="float: right; color: #667eea;">${team.completionRate}% completion rate</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div class="footer">
              <p>This is your automated daily report from ProUltima Task Manager.</p>
              <p>Keep up the great work!</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Daily Task Report - ${new Date().toLocaleDateString()}`,
    html,
  });
}

/**
 * Send task update notification
 */
export async function sendTaskUpdateEmail(
  task: Task,
  assigneeEmail: string,
  assigneeName: string,
  changes: Partial<Task>
) {
  const changeList = Object.entries(changes)
    .filter(([key, value]) => value !== undefined && key !== 'id')
    .map(([key, value]) => {
      const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<li><strong>${displayKey}:</strong> ${value}</li>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .changes { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Task Updated</h1>
            <p>Hello ${assigneeName},</p>
            <p>A task assigned to you has been updated.</p>
          </div>
          <div class="content">
            <div class="task-card">
              <h2>${task.title}</h2>
              <p><strong>Description:</strong> ${task.description || 'No description'}</p>
              <p><strong>Status:</strong> <span class="badge status">${task.status}</span></p>
              <p><strong>Priority:</strong> <span class="badge priority">${task.priority}</span></p>
              ${task.due_date ? `<p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
            </div>
            
            ${changeList ? `
              <div class="changes">
                <h3>📋 Changes Made:</h3>
                <ul>${changeList}</ul>
              </div>
            ` : ''}
            
            <p>Please review the updated task and take any necessary actions.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/tasks" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: assigneeEmail,
    subject: `Task Updated: ${task.title}`,
    html,
  });
}

/**
 * Send task reassignment notification
 */
export async function sendTaskReassignmentEmail(
  task: Task,
  oldAssigneeEmail: string,
  newAssigneeEmail: string,
  newAssigneeName: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Task Reassigned</h1>
            <p>Hello ${newAssigneeName},</p>
            <p>A task has been reassigned to you.</p>
          </div>
          <div class="content">
            <div class="task-card">
              <h2>${task.title}</h2>
              <p><strong>Description:</strong> ${task.description || 'No description'}</p>
              <p><strong>Status:</strong> <span class="badge status">${task.status}</span></p>
              <p><strong>Priority:</strong> <span class="badge priority">${task.priority}</span></p>
              ${task.due_date ? `<p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
            </div>
            
            <p>This task was previously assigned to another team member and has now been reassigned to you.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/tasks" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: newAssigneeEmail,
    subject: `Task Reassigned: ${task.title}`,
    html,
  });
}

/**
 * Send task delegation notification
 */
export async function sendTaskDelegationEmail(
  task: Task,
  assigneeEmail: string,
  assigneeName: string,
  delegatedBy: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .delegation-info { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Task Delegated to You</h1>
            <p>Hello ${assigneeName},</p>
            <p>You have been assigned to help with a delegated task.</p>
          </div>
          <div class="content">
            <div class="delegation-info">
              <p><strong>📋 Delegation Notice:</strong> This task was delegated to you by <strong>${delegatedBy}</strong> to help with completion.</p>
              <p><strong>Note:</strong> The original assignee (${delegatedBy}) remains responsible for this task.</p>
            </div>
            
            <div class="task-card">
              <h2>${task.title}</h2>
              <p><strong>Description:</strong> ${task.description || 'No description'}</p>
              <p><strong>Status:</strong> <span class="badge status">${task.status}</span></p>
              <p><strong>Priority:</strong> <span class="badge priority">${task.priority}</span></p>
              ${task.due_date ? `<p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
            </div>
            
            <p>Please coordinate with ${delegatedBy} to ensure successful task completion.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/tasks" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager.</p>
            <p><strong>Admin has been notified</strong> about this delegation.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: assigneeEmail,
    subject: `Task Delegated: ${task.title}`,
    html,
  });
}

/**
 * Send admin notification about task delegation
 */
export async function sendDelegationAdminNotification(
  task: Task,
  delegatedBy: string,
  adminEmail: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Task Delegation Alert</h1>
            <p>Admin Notification</p>
          </div>
          <div class="content">
            <div class="alert">
              <p><strong>⚠️ Attention Required:</strong> A task has been delegated by a staff member and requires your review.</p>
            </div>
            
            <div class="task-card">
              <h2>${task.title}</h2>
              <p><strong>Description:</strong> ${task.description || 'No description'}</p>
              <p><strong>Status:</strong> <span class="badge status">${task.status}</span></p>
              <p><strong>Priority:</strong> <span class="badge priority">${task.priority}</span></p>
              <p><strong>Delegated by:</strong> ${delegatedBy}</p>
              ${task.due_date ? `<p><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>` : ''}
            </div>
            
            <p>The original assignee remains responsible for this task, but additional staff members have been added to help with completion.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/tasks" class="button">Review in Admin Panel</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Task Delegation Alert: ${task.title}`,
    html,
  });
}

/**
 * Send maintenance request notification to admin
 */
export async function sendMaintenanceRequestEmail(
  request: MaintenanceRequest,
  adminEmail: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Maintenance Request</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔧 New Maintenance Request</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello Admin,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              A new maintenance request has been submitted by <strong>${request.staff?.name || 'Staff'}</strong> from <strong>${request.branch}</strong> branch.
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #667eea;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Staff:</td>
                  <td style="padding: 8px 0; color: #333;">${request.staff?.name || 'Unknown'} (${request.staff?.employee_id || 'N/A'})</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0; color: #333;">${request.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Serial Number:</td>
                  <td style="padding: 8px 0; color: #333;">${request.serial_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Brand:</td>
                  <td style="padding: 8px 0; color: #333;">${request.brand_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Workstation:</td>
                  <td style="padding: 8px 0; color: #333;">${request.workstation_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Condition:</td>
                  <td style="padding: 8px 0; color: #333; text-transform: capitalize;">${request.condition}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: #333; text-transform: capitalize;">${request.running_status.replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Report Month:</td>
                  <td style="padding: 8px 0; color: #333;">${new Date(request.report_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/maintenance" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Request</a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New Maintenance Request from ${request.staff?.name || 'Staff'}`,
    html,
  });
}

/**
 * Send maintenance approval notification to staff
 */
export async function sendMaintenanceApprovalEmail(
  request: MaintenanceRequest,
  staffEmail: string,
  adminNotes?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maintenance Request Approved</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Maintenance Request Approved</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello ${request.staff?.name || 'Staff'},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Great news! Your maintenance request has been <strong style="color: #22c55e;">approved</strong> by the admin.
            </p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #22c55e;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Serial Number:</td>
                  <td style="padding: 8px 0; color: #333;">${request.serial_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Brand:</td>
                  <td style="padding: 8px 0; color: #333;">${request.brand_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0; color: #333;">${request.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: #22c55e; font-weight: bold;">✓ Approved</td>
                </tr>
              </table>
            </div>

            ${adminNotes ? `
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #667eea;">Admin Notes:</h3>
                <p style="color: #333; margin: 0;">${adminNotes}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/maintenance" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">View Request</a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: 'Your Maintenance Request Has Been Approved',
    html,
  });
}

/**
 * Send maintenance rejection notification to staff
 */
export async function sendMaintenanceRejectionEmail(
  request: MaintenanceRequest,
  staffEmail: string,
  rejectionReason: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maintenance Request Rejected</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">❌ Maintenance Request Rejected</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello ${request.staff?.name || 'Staff'},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Unfortunately, your maintenance request has been <strong style="color: #ef4444;">rejected</strong> by the admin.
            </p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #ef4444;">Request Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Serial Number:</td>
                  <td style="padding: 8px 0; color: #333;">${request.serial_number || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Brand:</td>
                  <td style="padding: 8px 0; color: #333;">${request.brand_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Branch:</td>
                  <td style="padding: 8px 0; color: #333;">${request.branch}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Status:</td>
                  <td style="padding: 8px 0; color: #ef4444; font-weight: bold;">✗ Rejected</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #ef4444;">Rejection Reason:</h3>
              <p style="color: #333; margin: 0;">${rejectionReason}</p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #667eea;">Next Steps:</h3>
              <p style="color: #333; margin: 0;">
                Please review the rejection reason and resubmit your request with the necessary corrections, or contact your administrator for more information.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/staff/maintenance" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">View Request</a>
            </div>
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">This is an automated notification from ProUltima Task Manager.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: 'Your Maintenance Request Has Been Rejected',
    html,
  });
}

/**
 * Send task rejection notification to staff
 */
export async function sendTaskRejectionEmail(
  task: Task,
  staffEmail: string,
  staffName: string,
  rejectedBy: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">❌ Task Rejected</h1>
          </div>
          <div class="content">
            <p>Hi ${staffName},</p>
            
            <p><strong>${rejectedBy} rejected your task: ${task.title}</strong></p>
            
            <div class="task-info">
              <p style="margin: 10px 0;"><strong>Your task is back in progress</strong></p>
              <p style="margin: 10px 0;">Priority: ${task.priority.toUpperCase()}</p>
              ${task.due_date ? `<p style="margin: 10px 0;">Due Date: ${new Date(task.due_date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>` : ''}
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View Task
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Task Manager.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: `Task Rejected: ${task.title}`,
    html,
  });
}

/**
 * Send task approval notification to staff
 */
export async function sendTaskApprovalEmail(
  task: Task,
  staffEmail: string,
  staffName: string,
  approvedBy: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Task Approved</h1>
          </div>
          <div class="content">
            <p>Hi ${staffName},</p>
            
            <p><strong>${approvedBy} approved your task: ${task.title}</strong></p>
            
            <div class="task-info">
              <p style="margin: 10px 0;"><strong>Task completed successfully</strong></p>
              <p style="margin: 10px 0;">Priority: ${task.priority.toUpperCase()}</p>
            </div>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/staff/tasks" class="button">
              View Tasks
            </a>
            
            <div class="footer">
              <p>This is an automated email from ProUltima Task Manager.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: staffEmail,
    subject: `Task Approved: ${task.title}`,
    html,
  });
}

