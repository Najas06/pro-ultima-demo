'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Team, TeamMember } from '@/types'

// ============================================
// VALIDATION SCHEMAS
// ============================================

const teamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().optional(),
  leader_id: z.string().min(1, 'Leader is required'),
  branch: z.string().optional(),
  member_ids: z.array(z.string()).default([]),
})

const updateTeamSchema = teamSchema.extend({
  id: z.string().min(1, 'Team ID is required'),
})

// ============================================
// SERVER ACTIONS
// ============================================

/**
 * Create a new team
 */
export async function createTeam(formData: {
  name: string
  description?: string
  leader_id: string
  branch?: string
  member_ids: string[]
}) {
  try {
    // Validate input
    const validatedData = teamSchema.parse(formData)
    const supabase = await createClient()

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: validatedData.name,
        description: validatedData.description || null,
        leader_id: validatedData.leader_id,
        branch: validatedData.branch || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (teamError) {
      console.error('Supabase team creation error:', teamError)
      return {
        success: false,
        error: `Failed to create team: ${teamError.message}`,
      }
    }

    // Add team members if any
    if (validatedData.member_ids.length > 0) {
      const members = validatedData.member_ids.map((staff_id) => ({
        team_id: team.id,
        staff_id: staff_id,
        joined_at: new Date().toISOString(),
      }))

      const { error: membersError } = await supabase
        .from('team_members')
        .insert(members)

      if (membersError) {
        console.error('Error adding team members:', membersError)
        // Continue even if members fail - team is created
      }
    }

    // Fetch the complete team with leader and members
    const completeTeam = await getTeamById(team.id)

    revalidatePath('/admin/teams')

    return {
      success: true,
      data: completeTeam.data,
    }
  } catch (error) {
    console.error('Error in createTeam:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create team',
    }
  }
}

/**
 * Update an existing team
 */
export async function updateTeam(formData: {
  id: string
  name: string
  description?: string
  leader_id: string
  branch?: string
  member_ids: string[]
}) {
  try {
    const validatedData = updateTeamSchema.parse(formData)
    const supabase = await createClient()

    // Update team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .update({
        name: validatedData.name,
        description: validatedData.description || null,
        leader_id: validatedData.leader_id,
        branch: validatedData.branch || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (teamError) {
      console.error('Supabase team update error:', teamError)
      return {
        success: false,
        error: `Failed to update team: ${teamError.message}`,
      }
    }

    // Update team members
    // First, remove all existing members
    await supabase
      .from('team_members')
      .delete()
      .eq('team_id', validatedData.id)

    // Then add new members
    if (validatedData.member_ids.length > 0) {
      const members = validatedData.member_ids.map((staff_id) => ({
        team_id: team.id,
        staff_id: staff_id,
        joined_at: new Date().toISOString(),
      }))

      const { error: membersError } = await supabase
        .from('team_members')
        .insert(members)

      if (membersError) {
        console.error('Error updating team members:', membersError)
      }
    }

    // Fetch the complete team with leader and members
    const completeTeam = await getTeamById(team.id)

    revalidatePath('/admin/teams')

    return {
      success: true,
      data: completeTeam.data,
    }
  } catch (error) {
    console.error('Error in updateTeam:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update team',
    }
  }
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string) {
  try {
    const supabase = await createClient()

    // Delete team members first (foreign key constraint)
    await supabase.from('team_members').delete().eq('team_id', teamId)

    // Delete the team
    const { error } = await supabase.from('teams').delete().eq('id', teamId)

    if (error) {
      console.error('Supabase team deletion error:', error)
      return {
        success: false,
        error: `Failed to delete team: ${error.message}`,
      }
    }

    revalidatePath('/admin/teams')

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteTeam:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete team',
    }
  }
}

/**
 * Get all teams with their leaders and members
 */
export async function getAllTeams(): Promise<Team[]> {
  try {
    const supabase = await createClient()

    // Fetch teams with leaders
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(
        `
        *,
        leader:staff!teams_leader_id_fkey(*)
      `
      )
      .order('created_at', { ascending: false })

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return []
    }

    if (!teams) return []

    // Fetch members for each team
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const { data: members } = await supabase
          .from('team_members')
          .select(
            `
            *,
            staff(*)
          `
          )
          .eq('team_id', team.id)

        return {
          ...team,
          members: members || [],
        }
      })
    )

    return teamsWithMembers as Team[]
  } catch (error) {
    console.error('Error in getAllTeams:', error)
    return []
  }
}

/**
 * Get a single team by ID with leader and members
 */
export async function getTeamById(
  teamId: string
): Promise<{ success: boolean; data?: Team; error?: string }> {
  try {
    const supabase = await createClient()

    // Fetch team with leader
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(
        `
        *,
        leader:staff!teams_leader_id_fkey(*)
      `
      )
      .eq('id', teamId)
      .single()

    if (teamError) {
      console.error('Error fetching team:', teamError)
      return {
        success: false,
        error: `Failed to fetch team: ${teamError.message}`,
      }
    }

    // Fetch team members
    const { data: members } = await supabase
      .from('team_members')
      .select(
        `
        *,
        staff(*)
      `
      )
      .eq('team_id', teamId)

    return {
      success: true,
      data: {
        ...team,
        members: members || [],
      } as Team,
    }
  } catch (error) {
    console.error('Error in getTeamById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch team',
    }
  }
}

