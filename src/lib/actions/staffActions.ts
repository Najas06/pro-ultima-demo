'use server'

import { createClient } from '../supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// VALIDATION SCHEMAS
// ============================================

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  employee_id: z.string().min(1, 'Employee ID is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  branch: z.string().optional(),
  phone: z.string().optional(),
})

const updateStaffSchema = staffSchema.partial().extend({
  id: z.string().uuid(),
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Upload image to Supabase Storage and return public URL
 */
async function uploadImageToStorage(
  base64Image: string,
  fileName: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient()

    // Convert base64 to buffer
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate unique file name
    const fileExt = base64Image.match(/^data:image\/(\w+);base64,/)?.[1] || 'png'
    const uniqueFileName = `${Date.now()}-${fileName}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('staff-profiles')
      .upload(uniqueFileName, buffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { url: null, error: error.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('staff-profiles').getPublicUrl(data.path)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Image upload error:', error)
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Failed to upload image',
    }
  }
}

/**
 * Delete image from Supabase Storage
 */
async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Extract file path from URL
    const urlParts = imageUrl.split('/staff-profiles/')
    if (urlParts.length < 2) return

    const filePath = urlParts[1]

    await supabase.storage.from('staff-profiles').remove([filePath])
  } catch (error) {
    console.error('Failed to delete image:', error)
  }
}

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Create a new staff member
 */
export async function createStaff(formData: {
  name: string
  employee_id: string
  email: string
  password: string
  role: string
  department: string
  branch?: string
  phone?: string
  profileImage?: string
}) {
  try {
    // Validate input
    const validatedData = staffSchema.parse(formData)

    const supabase = await createClient()

    // Handle image upload if provided
    let profileImageUrl: string | null = null
    if (formData.profileImage) {
      const { url, error } = await uploadImageToStorage(
        formData.profileImage,
        validatedData.employee_id
      )

      if (error) {
        return {
          success: false,
          error: `Failed to upload image: ${error}`,
        }
      }

      profileImageUrl = url
    }

    // Insert staff record
    const { data, error } = await supabase
      .from('staff')
      .insert({
        name: validatedData.name,
        employee_id: validatedData.employee_id,
        email: validatedData.email,
        password: validatedData.password, // TODO: Hash password in production
        role: validatedData.role,
        department: validatedData.department,
        branch: validatedData.branch || null,
        phone: validatedData.phone || null,
        profile_image_url: profileImageUrl,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      // Clean up uploaded image if database insert fails
      if (profileImageUrl) {
        await deleteImageFromStorage(profileImageUrl)
      }

      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate the staff page to show new data
    revalidatePath('/admin/staff')

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        employeeId: data.employee_id,
        email: data.email,
        role: data.role,
        department: data.department,
        branch: data.branch,
        phone: data.phone,
        profileImage: data.profile_image_url,
      },
    }
  } catch (error) {
    console.error('Create staff error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create staff member',
    }
  }
}

/**
 * Update an existing staff member
 */
export async function updateStaff(formData: {
  id: string
  name?: string
  employee_id?: string
  email?: string
  role?: string
  department?: string
  branch?: string
  phone?: string
  profileImage?: string
  oldProfileImageUrl?: string
}) {
  try {
    // Validate input
    const validatedData = updateStaffSchema.parse(formData)

    const supabase = await createClient()

    // Handle image upload if new image provided
    let profileImageUrl: string | null | undefined = undefined
    if (formData.profileImage && formData.profileImage.startsWith('data:image')) {
      // Delete old image if exists
      if (formData.oldProfileImageUrl) {
        await deleteImageFromStorage(formData.oldProfileImageUrl)
      }

      const { url, error } = await uploadImageToStorage(
        formData.profileImage,
        formData.employee_id || validatedData.id
      )

      if (error) {
        return {
          success: false,
          error: `Failed to upload image: ${error}`,
        }
      }

      profileImageUrl = url
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.employee_id) updateData.employee_id = validatedData.employee_id
    if (validatedData.email) updateData.email = validatedData.email
    if (validatedData.role) updateData.role = validatedData.role
    if (validatedData.department) updateData.department = validatedData.department
    if (validatedData.branch !== undefined) updateData.branch = validatedData.branch
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (profileImageUrl !== undefined) updateData.profile_image_url = profileImageUrl

    // Update staff record
    const { data, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      // Clean up uploaded image if database update fails
      if (profileImageUrl && typeof profileImageUrl === 'string') {
        await deleteImageFromStorage(profileImageUrl)
      }

      return {
        success: false,
        error: error.message,
      }
    }

    // Revalidate the staff page
    revalidatePath('/admin/staff')

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        employeeId: data.employee_id,
        email: data.email,
        role: data.role,
        department: data.department,
        branch: data.branch,
        phone: data.phone,
        profileImage: data.profile_image_url,
      },
    }
  } catch (error) {
    console.error('Update staff error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update staff member',
    }
  }
}

/**
 * Delete a staff member (soft delete)
 */
export async function deleteStaff(id: string) {
  try {
    const supabase = await createClient()

    // Get staff member to check for image
    const { data: staff } = await supabase
      .from('staff')
      .select('profile_image_url')
      .eq('id', id)
      .single()

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('staff')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Optionally delete image from storage
    // Note: You might want to keep images for record-keeping
    // if (staff?.profile_image_url) {
    //   await deleteImageFromStorage(staff.profile_image_url)
    // }

    // Revalidate the staff page
    revalidatePath('/admin/staff')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Delete staff error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete staff member',
    }
  }
}

/**
 * Get all active staff members
 */
export async function getAllStaff() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message,
        data: [],
      }
    }

    // Transform data to match frontend interface
    const transformedData = data.map((staff) => ({
      id: staff.id,
      name: staff.name,
      employeeId: staff.employee_id,
      email: staff.email,
      role: staff.role,
      department: staff.department,
      branch: staff.branch,
      phone: staff.phone,
      profileImage: staff.profile_image_url,
    }))

    return {
      success: true,
      data: transformedData,
    }
  } catch (error) {
    console.error('Get staff error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch staff members',
      data: [],
    }
  }
}

/**
 * Get a single staff member by ID
 */
export async function getStaffById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        data: null,
      }
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        employeeId: data.employee_id,
        email: data.email,
        role: data.role,
        department: data.department,
        branch: data.branch,
        phone: data.phone,
        profileImage: data.profile_image_url,
      },
    }
  } catch (error) {
    console.error('Get staff by ID error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch staff member',
      data: null,
    }
  }
}

