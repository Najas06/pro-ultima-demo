"use server";

import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcrypt";

export async function getSystemOptions() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('admins')
    .select('roles, departments, branches')
    .eq('email', 'admin@proultima.com')
    .single();

  if (error) {
    console.error('Error fetching system options:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      roles: data?.roles || [],
      departments: data?.departments || [],
      branches: data?.branches || [],
    },
  };
}

export async function addSystemOption(
  type: 'roles' | 'departments' | 'branches',
  value: string
) {
  const supabase = await createClient();

  // Trim and validate
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return { success: false, error: 'Value cannot be empty' };
  }

  // Get current options
  const { data: currentData, error: fetchError } = await supabase
    .from('admins')
    .select(type)
    .eq('email', 'admin@proultima.com')
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  const currentOptions = (currentData as Record<string, string[]>)?.[type] || [];

  // Check for duplicates (case-insensitive)
  const exists = currentOptions.some(
    (option: string) => option.toLowerCase() === trimmedValue.toLowerCase()
  );

  if (exists) {
    return { success: false, error: 'This option already exists' };
  }

  // Add new option
  const updatedOptions = [...currentOptions, trimmedValue];

  const { error: updateError } = await supabase
    .from('admins')
    .update({ [type]: updatedOptions })
    .eq('email', 'admin@proultima.com');

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, data: updatedOptions };
}

export async function removeSystemOption(
  type: 'roles' | 'departments' | 'branches',
  value: string
) {
  const supabase = await createClient();

  // Check if option is in use
  const columnName = type === 'roles' ? 'role' : type === 'departments' ? 'department' : 'branch';
  const { data: staffUsingOption, error: checkError } = await supabase
    .from('staff')
    .select('id')
    .eq(columnName, value)
    .limit(1);

  if (checkError) {
    return { success: false, error: checkError.message };
  }

  if (staffUsingOption && staffUsingOption.length > 0) {
    return {
      success: false,
      error: `Cannot delete: This ${type.slice(0, -1)} is currently assigned to staff members`,
    };
  }

  // Get current options
  const { data: currentData, error: fetchError } = await supabase
    .from('admins')
    .select(type)
    .eq('email', 'admin@proultima.com')
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  const currentOptions = (currentData as Record<string, string[]>)?.[type] || [];
  const updatedOptions = currentOptions.filter((option: string) => option !== value);

  const { error: updateError } = await supabase
    .from('admins')
    .update({ [type]: updatedOptions })
    .eq('email', 'admin@proultima.com');

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, data: updatedOptions };
}

export async function updateAdminProfile(data: { name?: string; email?: string }) {
  const supabase = await createClient();

  const updateData: { name?: string; email?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (data.name) updateData.name = data.name.trim();
  if (data.email) updateData.email = data.email.trim().toLowerCase();

  const { error } = await supabase
    .from('admins')
    .update(updateData)
    .eq('email', 'admin@proultima.com');

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateAdminPassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const supabase = await createClient();

  // Get current admin data
  const { data: adminData, error: fetchError } = await supabase
    .from('admins')
    .select('password_hash')
    .eq('email', 'admin@proultima.com')
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(
    data.currentPassword,
    adminData.password_hash
  );

  if (!isValidPassword) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

  // Update password
  const { error: updateError } = await supabase
    .from('admins')
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString(),
    })
    .eq('email', 'admin@proultima.com');

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function getAdminProfile() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('admins')
    .select('id, name, email, created_at')
    .eq('email', 'admin@proultima.com')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

