# ProUltima Task Manager PWA - Complete Setup Guide

## Project Overview
Building a Progressive Web Application task management dashboard with Next.js 15, featuring 5 main pages: Dashboard, Tasks, Teams, Staff, and Reports.

**Tech Stack:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- PWA capabilities
- Sonner toast

**State Management Strategy:**
- Server Actions for CRUD operations
- React Query (TanStack Query) for server state
- Zustand for client state
- Optimistic updates for instant UI feedback

---

## Phase 1: Project Initialization & Dependencies

### Task 1.1: Initialize Next.js 15 Project
- Create new Next.js 15 project with TypeScript
- Configure App Router structure
- Set up Tailwind CSS
- Install and configure shadcn/ui components

### Task 1.2: Install Core Dependencies
- Install React Query (@tanstack/react-query)
- Install Zustand for state management
- Install Supabase client libraries
- Install drag-and-drop library (@dnd-kit/core)
- Install PWA library (@ducanh2912/next-pwa)

### Task 1.3: Install Development Dependencies
- Install TypeScript types
- Install ESLint and Prettier
- Install testing libraries (optional)

---

## Phase 2: PWA Configuration

### Task 2.1: Configure Next.js for PWA
- Update next.config.mjs with PWA settings
- Configure service worker options
- Set up offline caching strategies
- Configure runtime caching for API routes

### Task 2.2: Create PWA Manifest
- Create public/manifest.json
- Define app name, icons, theme colors
- Configure display mode (standalone)
- Add app icons (192x192, 512x512)

### Task 2.3: Update Root Layout
- Add manifest link to metadata
- Configure viewport for PWA
- Add theme-color meta tag
- Set up apple-touch-icon

---

## Phase 3: Supabase Setup

### Task 3.1: Configure Supabase Project
- Create Supabase project
- Set up database tables (tasks, teams, staff, reports)
- Configure Row Level Security (RLS) policies
- Set up authentication (if needed)

### Task 3.2: Create Supabase Clients
- Create client-side Supabase client
- Create server-side Supabase client
- Configure environment variables
- Set up connection pooling

### Task 3.3: Database Schema Design
- Design tasks table with all required fields
- Design teams table with staff relationships
- Design staff table with user details
- Set up foreign key relationships

---

## Phase 4: State Management Setup

### Task 4.1: Configure React Query Provider
- Set up QueryClient with optimal settings
- Configure stale time and cache time
- Set up retry policies
- Wrap app with QueryClientProvider

### Task 4.2: Create Zustand Store
- Create UI store for dialog states
- Create filter store for search/filter states
- Create drag state for DnD operations
- Set up typed selectors

### Task 4.3: Create Custom Hooks
- Create useTasks hook for task operations
- Create useStaff hook for staff operations
- Create useTeams hook for team operations
- Create optimistic mutation hooks

---

## Phase 5: Server Actions Implementation

### Task 5.1: Create Task Server Actions
- Create createTask action with validation
- Create updateTask action with optimistic updates
- Create deleteTask action with revalidation
- Create updateTaskStatus for drag-drop

### Task 5.2: Create Team Server Actions
- Create createTeam action with staff assignment
- Create updateTeam action
- Create deleteTeam action
- Create assignStaffToTeam action

### Task 5.3: Create Staff Server Actions
- Create createStaff action
- Create updateStaff action
- Create deleteStaff action
- Create getAvailableStaff action

---

## Phase 6: Dashboard Page Implementation

### Task 6.1: Create Stats Cards Component
- Design 4 stat cards (Total, Completed, In Progress, Incomplete)
- Implement loading skeletons
- Add real-time data updates
- Style with Tailwind CSS grid

### Task 6.2: Create Tasks Data Table
- Set up shadcn Data Table component
- Configure columns (name, assignee, timeline, priority, status, repeat, actions)
- Implement sorting and filtering
- Add CRUD action buttons

### Task 6.3: Integrate Dashboard Page
- Fetch tasks data with React Query
- Implement error boundaries
- Add Suspense with loading fallbacks
- Set up real-time subscriptions

---

## Phase 7: Tasks Page with Drag & Drop

### Task 7.1: Setup Drag & Drop Infrastructure
- Configure DndContext with sensors
- Set up collision detection
- Create droppable columns (Backlog, Todo, In Progress, Done)
- Implement drag handle components

### Task 7.2: Create Task Card Component
- Design draggable task card
- Display task information (name, assignee, priority, deadline)
- Add drag animations
- Implement sortable functionality

### Task 7.3: Create Kanban Board
- Set up 4-column layout
- Implement drag end handler
- Add optimistic updates for status changes
- Create search and filter functionality

### Task 7.4: Integrate Tasks Page
- Combine stats cards with kanban board
- Add search bar with debouncing
- Implement real-time updates
- Add empty states

---

## Phase 8: Teams Page Implementation

### Task 8.1: Create Team Creation Dialog
- Design team creation form
- Implement staff selection with checkboxes
- Add captain selection dropdown
- Handle form validation and submission

### Task 8.2: Create Teams Grid Component
- Display teams as card grid
- Show team name, captain, member count
- Add edit and delete actions
- Implement optimistic updates

### Task 8.3: Integrate Teams Page
- Add "Create Team" button
- Render teams grid
- Handle empty states
- Add team management actions

---

## Phase 9: Staff Page Implementation

### Task 9.1: Create Staff Form Dialog
- Design staff creation/editing form
- Add form fields (name, email, role, department)
- Implement form validation with Zod
- Handle both create and edit modes

### Task 9.2: Create Staff Data Table
- Set up staff data table with shadcn
- Add search functionality
- Implement edit and delete actions
- Add optimistic updates

### Task 9.3: Integrate Staff Page
- Add "Add Staff" button
- Render staff table
- Handle CRUD operations
- Add loading and error states

---

## Phase 10: Reports Page Implementation

### Task 10.1: Create Report Components
- Design report cards/charts
- Implement data visualization
- Add date range filters
- Create export functionality

### Task 10.2: Integrate Reports Page
- Fetch report data
- Display analytics
- Add filtering options
- Implement data export

---

## Phase 11: Optimistic Updates & Real-time

### Task 11.1: Implement Optimistic Updates
- Create optimistic mutation wrapper
- Update all CRUD operations
- Handle rollback on errors
- Add loading indicators

### Task 11.2: Setup Real-time Subscriptions
- Configure Supabase real-time
- Subscribe to table changes
- Invalidate React Query cache
- Handle connection states

### Task 11.3: Add Toast Notifications
- Install and configure Sonner
- Add success/error notifications
- Show loading states
- Add retry functionality

---

## Phase 12: Performance Optimization

### Task 12.1: Implement Loading States
- Create skeleton components
- Add Suspense boundaries
- Implement progressive loading
- Add error boundaries

### Task 12.2: Optimize React Query
- Configure query settings
- Add placeholder data
- Implement background refetching
- Optimize cache strategies

### Task 12.3: Bundle Optimization
- Analyze bundle size
- Implement code splitting
- Optimize imports
- Add bundle analyzer

---

## Phase 13: PWA Features

### Task 13.1: Offline Functionality
- Configure service worker
- Implement offline caching
- Add offline indicators
- Handle offline data sync

### Task 13.2: Install Prompts
- Add install prompts
- Handle PWA installation
- Create install instructions
- Test on mobile devices

### Task 13.3: Push Notifications (Optional)
- Set up push notification service
- Configure notification permissions
- Add notification triggers
- Handle notification actions

---

## Phase 14: Testing & Quality Assurance

### Task 14.1: Component Testing
- Test all components
- Verify CRUD operations
- Test drag and drop functionality
- Validate form submissions

### Task 14.2: PWA Testing
- Test offline functionality
- Verify service worker
- Test install prompts
- Validate manifest

### Task 14.3: Performance Testing
- Test loading times
- Verify real-time updates
- Test on mobile devices
- Check bundle sizes

---

## Phase 15: Deployment & Production

### Task 15.1: Environment Setup
- Configure production environment variables
- Set up Supabase production database
- Configure Vercel deployment
- Set up domain and SSL

### Task 15.2: Production Deployment
- Deploy to Vercel
- Configure environment variables
- Test production build
- Verify PWA functionality

### Task 15.3: Post-Deployment
- Monitor performance
- Check error logs
- Test all features
- Gather user feedback

---

## File Structure Overview

```
app/
├── actions/           # Server Actions
├── admin/            # Admin pages
├── components/       # Reusable components
├── lib/             # Utilities and configs
├── hooks/           # Custom hooks
├── stores/          # Zustand stores
└── types/           # TypeScript types

components/
├── dashboard/       # Dashboard components
├── tasks/          # Task-related components
├── teams/          # Team components
├── staff/          # Staff components
├── reports/        # Report components
└── ui/             # shadcn/ui components
```

---

## Key Implementation Notes

### State Management Strategy
- **Server Actions**: Handle all database mutations
- **React Query**: Manage server state and caching
- **Zustand**: Handle client-only state (UI, filters)
- **Optimistic Updates**: Instant UI feedback

### Performance Considerations
- Use Server Actions instead of API routes
- Implement optimistic updates for instant feedback
- Configure React Query for optimal caching
- Use Supabase real-time for live updates

### PWA Features
- Offline functionality with service worker
- Install prompts for mobile devices
- App-like experience with standalone display
- Push notifications (optional)

### Security
- Row Level Security in Supabase
- Server-side validation with Zod
- Environment variable protection
- Secure authentication (if implemented)

---

## Completion Checklist

- [ ] Project initialized with Next.js 15
- [ ] PWA configured and working
- [ ] Supabase connected and configured
- [ ] State management setup complete
- [ ] All Server Actions implemented
- [ ] Dashboard page with stats and table
- [ ] Tasks page with drag-and-drop
- [ ] Teams page with staff selection
- [ ] Staff page with CRUD operations
- [ ] Reports page implemented
- [ ] Optimistic updates working
- [ ] Real-time subscriptions active
- [ ] PWA features tested
- [ ] Deployed to production
- [ ] Performance optimized

---

## Next Steps After Completion

1. Add comprehensive testing suite
2. Implement role-based access control
3. Add advanced reporting features
4. Implement task templates
5. Add time tracking capabilities
6. Create mobile app versions
7. Add integration with external tools
8. Implement advanced analytics

This guide provides a complete roadmap for building your PWA task management dashboard with optimal performance and modern development practices.
