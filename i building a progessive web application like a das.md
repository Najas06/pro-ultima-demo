<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# i building a progessive web application like a dashboard , there 5 pages dashboard, tasks, teams, staffs and report , i using stack is nextjs 15 , tailwind css, shadcnui , supabase, typescript and i dont know what is better state instant data show for CRUD operation  you can choose any for best,

the dashboard page show 4 card like total tasks, completd tasks, processing task, incompleted task
under a modern table from shdcn show all task sort by recent show name, assign, timeline, priority,status, repeat, action (CRUD)

in task page show same 4 cards status of completed, progessing, icomplmenent , total . under show 4 table drag and drop assign status and a search bar identiyfy by name

in team page show create team shadcn dialog , the flow is show all staffs and select one person assign a caption kind idea ,

in staff page add staff details and crud opetaion

i already do it you can check - [https://proultima-taskmanager.vercel.app/admin/dashboard](https://proultima-taskmanager.vercel.app/admin/dashboard)

now i want more serverless fact and optimisate full powerof nextjs other tech stack

i using curosr , i want a complete setup guide.md task by task complete my cursor and prompt and also

Based on your Next.js 15 PWA task management dashboard requirements, here's a comprehensive guide for optimizing with server actions, optimistic updates, and modern state management patterns.[^1][^2][^3]

## Recommended State Management Architecture

For instant CRUD operations with your tech stack, use **Server Actions + Optimistic Updates + Zustand** for the best serverless performance.[^4][^5][^6]

**Server Actions** handle all database mutations directly from components without API routes, **Optimistic UI** updates happen instantly before server confirmation, and **Zustand** manages minimal client state like UI toggles and filters.[^7][^1][^4]

For your dashboard with real-time task updates from Supabase, combine Server Actions with Supabase Realtime subscriptions for live data synchronization.[^8][^9][^10]

## Tech Stack Optimization

### State Management Strategy

**React Query (TanStack Query)** - For server state and caching task/staff data with automatic background refetching[^11][^12]

**Zustand** - For client-only state like dialog open/close, filters, drag state[^13][^14]

**Server Actions** - For all CRUD operations with optimistic updates[^3][^5][^4]

### Drag and Drop Implementation

Use **@dnd-kit/core** with shadcn/ui tables for the drag-and-drop task board functionality. This library provides excellent TypeScript support and works seamlessly with Next.js 15.[^15][^16][^17][^18]

### PWA Configuration

Install `@ducanh2912/next-pwa` (maintained fork) for Next.js 15 PWA support with offline capabilities.[^19][^20][^21]

## Complete Setup Guide

```markdown
# Task Manager PWA - Complete Setup Guide

## Prerequisites
- Node.js 18+
- Supabase project with tables configured
- Cursor IDE installed

## Phase 1: Project Dependencies

### Install Core Dependencies
```

npm install @tanstack/react-query zustand
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @supabase/ssr @supabase/supabase-js
npm install @ducanh2912/next-pwa

```

### Install Dev Dependencies
```

npm install -D @types/node typescript

```

## Phase 2: PWA Configuration

### Task 2.1: Configure next.config.js
**Prompt for Cursor:**
```

Create next.config.mjs with PWA support using @ducanh2912/next-pwa.
Configure:

- dest: "public"
- disable: false in production
- register: true
- skipWaiting: true
- runtimeCaching for API routes
- workboxOptions for offline support

```

### Task 2.2: Create Manifest File
**Prompt for Cursor:**
```

Create public/manifest.json for PWA with:

- name: "ProUltima Task Manager"
- short_name: "TaskManager"
- theme_color: "\#000000"
- background_color: "\#ffffff"
- display: "standalone"
- icons: 192x192 and 512x512

```

### Task 2.3: Update Root Layout
**Prompt for Cursor:**
```

Update app/layout.tsx to include:

- manifest link in metadata
- theme-color meta tag
- apple-touch-icon link
- viewport configuration for PWA

```

## Phase 3: State Management Setup

### Task 3.1: Configure React Query Provider
**Prompt for Cursor:**
```

Create lib/providers/query-provider.tsx with:

- QueryClientProvider setup
- staleTime: 5 minutes
- gcTime: 10 minutes
- refetchOnWindowFocus: false
- retry configuration
Wrap this in app/layout.tsx

```

### Task 3.2: Create Zustand Store
**Prompt for Cursor:**
```

Create stores/ui-store.ts with Zustand for:

- Dialog states (taskDialog, teamDialog, staffDialog)
- Filter states (searchQuery, statusFilter, priorityFilter)
- Loading states (isLoading, draggedItem)
Create typed selectors using middleware

```

### Task 3.3: Setup Supabase Client
**Prompt for Cursor:**
```

Create lib/supabase/client.ts for client-side queries
Create lib/supabase/server.ts for Server Actions
Use @supabase/ssr for cookie-based auth
Configure Row Level Security policies in Supabase

```

## Phase 4: Server Actions Implementation

### Task 4.1: Create Task Actions
**Prompt for Cursor:**
```

Create app/actions/tasks.ts with Server Actions:

- createTask(formData) with revalidatePath
- updateTask(id, data) with optimistic updates
- deleteTask(id) with revalidatePath
- updateTaskStatus(id, status) for drag-drop
Use "use server" directive
Return { success, data, error } format
Add Zod validation for inputs

```

### Task 4.2: Create Team Actions
**Prompt for Cursor:**
```

Create app/actions/teams.ts with:

- createTeam(name, staffIds, captainId)
- updateTeam(id, data)
- deleteTeam(id)
- assignStaffToTeam(teamId, staffId)
Include transaction handling for multi-step operations

```

### Task 4.3: Create Staff Actions
**Prompt for Cursor:**
```

Create app/actions/staff.ts with:

- createStaff(formData)
- updateStaff(id, data)
- deleteStaff(id)
- getAvailableStaff() for team assignment

```

## Phase 5: Dashboard Page Implementation

### Task 5.1: Create Dashboard Stats Cards
**Prompt for Cursor:**
```

Create components/dashboard/stats-cards.tsx:

- Use React Query to fetch task statistics
- Display 4 shadcn Card components for:
    * Total Tasks
    * Completed Tasks
    * In Progress Tasks
    * Incomplete Tasks
- Add loading skeletons
- Style with Tailwind CSS grid layout

```

### Task 5.2: Create Tasks Data Table
**Prompt for Cursor:**
```

Create components/dashboard/tasks-table.tsx using shadcn Data Table:

- Columns: name, assignee, timeline, priority, status, repeat, actions
- Use @tanstack/react-table for table logic
- Sort by createdAt descending by default
- Add CRUD action buttons (Edit, Delete) in actions column
- Implement optimistic updates on delete
- Add loading and empty states

```

### Task 5.3: Integrate Dashboard Page
**Prompt for Cursor:**
```

Update app/admin/dashboard/page.tsx:

- Fetch tasks using React Query useQuery
- Pass data to StatsCards and TasksTable
- Add error boundary
- Implement Suspense with fallback
- Use searchParams for filters

```

## Phase 6: Tasks Page with Drag and Drop

### Task 6.1: Setup DnD Kit
**Prompt for Cursor:**
```

Create components/tasks/kanban-board.tsx:

- Use DndContext from @dnd-kit/core
- Create 4 droppable columns: Backlog, Todo, In Progress, Done
- Use SortableContext for each column
- Implement sensors (PointerSensor, KeyboardSensor)
- Add collision detection strategy

```

### Task 6.2: Create Draggable Task Card
**Prompt for Cursor:**
```

Create components/tasks/task-card.tsx:

- Use useSortable hook
- Display task name, assignee, priority, deadline
- Style with shadcn Card
- Add transform CSS for drag animation
- Show drag handle icon

```

### Task 6.3: Implement Drag Handler
**Prompt for Cursor:**
```

In components/tasks/kanban-board.tsx add handleDragEnd:

- Get active and over items
- Call updateTaskStatus Server Action
- Use React Query mutation with optimistic update
- Revert on error
- Show toast notification

```

### Task 6.4: Add Search and Filter Bar
**Prompt for Cursor:**
```

Create components/tasks/filter-bar.tsx:

- shadcn Input for search by name
- Use Zustand store for filter state
- Debounce search input (300ms)
- Filter tasks array before rendering

```

### Task 6.5: Integrate Tasks Page
**Prompt for Cursor:**
```

Create app/admin/tasks/page.tsx:

- Render stats cards (reuse from dashboard)
- Render KanbanBoard component
- Render FilterBar component
- Setup React Query for tasks with refetchInterval: 30000

```

## Phase 7: Teams Page Implementation

### Task 7.1: Create Team Dialog
**Prompt for Cursor:**
```

Create components/teams/create-team-dialog.tsx:

- Use shadcn Dialog component
- Form with team name input (shadcn Input)
- Fetch all staff using React Query
- Display staff list with shadcn Checkbox
- Dropdown to select captain from selected staff
- Submit button calls createTeam Server Action
- Close dialog on success
- Control open state with Zustand

```

### Task 7.2: Create Teams List
**Prompt for Cursor:**
```

Create components/teams/teams-grid.tsx:

- Fetch teams using React Query
- Display as grid of shadcn Cards
- Show team name, captain (badge), member count
- Add Edit and Delete buttons
- Implement optimistic deletion

```

### Task 7.3: Integrate Teams Page
**Prompt for Cursor:**
```

Create app/admin/teams/page.tsx:

- Add "Create Team" button (opens dialog)
- Render CreateTeamDialog
- Render TeamsGrid
- Add empty state when no teams exist

```

## Phase 8: Staff Page Implementation

### Task 8.1: Create Staff Form Dialog
**Prompt for Cursor:**
```

Create components/staff/staff-form-dialog.tsx:

- Use shadcn Form with react-hook-form
- Fields: name, email, role, department
- Validate with Zod schema
- Support both create and edit modes
- Call createStaff or updateStaff Server Action

```

### Task 8.2: Create Staff Data Table
**Prompt for Cursor:**
```

Create components/staff/staff-table.tsx:

- Use shadcn Data Table
- Columns: name, email, role, department, actions
- Add search functionality
- Add Edit and Delete actions
- Implement optimistic updates

```

### Task 8.3: Integrate Staff Page
**Prompt for Cursor:**
```

Create app/admin/staff/page.tsx:

- Add "Add Staff" button
- Render StaffFormDialog
- Render StaffTable
- Fetch staff with React Query

```

## Phase 9: Optimistic Updates Pattern

### Task 9.1: Create Optimistic Hook
**Prompt for Cursor:**
```

Create hooks/use-optimistic-mutation.ts:

- Wrapper around useMutation
- Accept onMutate for optimistic update
- Handle rollback on error
- Show toast notifications
- Generic TypeScript types

```

### Task 9.2: Implement in Components
**Prompt for Cursor:**
```

Update all mutation calls to use useOptimisticMutation:

- Task delete: Remove from list immediately
- Task update: Update in list immediately
- Staff/Team operations: Same pattern
- Show loading spinner during server confirmation

```

## Phase 10: Real-time Supabase Integration

### Task 10.1: Setup Realtime Subscriptions
**Prompt for Cursor:**
```

Create hooks/use-realtime-tasks.ts:

- Subscribe to tasks table changes
- Use supabase.channel().on('postgres_changes')
- Listen for INSERT, UPDATE, DELETE
- Invalidate React Query cache on changes
- Cleanup subscription on unmount

```

### Task 10.2: Integrate Realtime Hooks
**Prompt for Cursor:**
```

Update dashboard and tasks pages:

- Call useRealtimeTasks() hook
- Display indicator when receiving updates
- Auto-refresh affected queries

```

## Phase 11: Performance Optimizations

### Task 11.1: Implement React Query Optimizations
**Prompt for Cursor:**
```

Update query configurations:

- Add placeholderData for instant loading states
- Use keepPreviousData for pagination
- Configure refetchInterval based on page
- Add select function to transform data

```

### Task 11.2: Add Loading States
**Prompt for Cursor:**
```

Create components/ui/skeletons.tsx:

- TableSkeleton with shadcn Skeleton
- CardSkeleton for stats
- KanbanSkeleton for task board
Use in Suspense fallbacks

```

### Task 11.3: Implement Error Boundaries
**Prompt for Cursor:**
```

Create components/error-boundary.tsx:

- Catch component errors
- Display user-friendly error message
- Add "Try again" button
- Log errors to monitoring service

```

## Phase 12: Testing and Deployment

### Task 12.1: Test PWA Functionality
**Manual Testing:**
- Open DevTools > Application > Manifest
- Verify service worker registration
- Test offline functionality
- Test "Add to Home Screen"
- Verify cache strategies

### Task 12.2: Optimize for Production
**Prompt for Cursor:**
```

Add to package.json scripts:

- "build": "next build"
- "analyze": "ANALYZE=true next build"
Install @next/bundle-analyzer
Check bundle size and optimize imports

```

### Task 12.3: Deploy to Vercel
```


# Connect GitHub repo to Vercel

# Add environment variables in Vercel dashboard:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY


# Deploy

git push origin main

```

## Phase 13: Advanced Features

### Task 13.1: Add Keyboard Shortcuts
**Prompt for Cursor:**
```

Create hooks/use-keyboard-shortcuts.ts:

- Cmd/Ctrl + K: Open search
- Cmd/Ctrl + N: New task
- Escape: Close dialogs
Use addEventListener and cleanup

```

### Task 13.2: Add Toast Notifications
**Prompt for Cursor:**
```

Setup shadcn Sonner for notifications:

- Success on CRUD operations
- Error messages with retry button
- Loading toasts for long operations

```

### Task 13.3: Add Analytics
**Prompt for Cursor:**
```

Create lib/analytics.ts:

- Track page views
- Track button clicks
- Track task operations
Use Vercel Analytics or Google Analytics

```

## Cursor AI Prompting Tips

### Effective Prompt Pattern
```

Context: [What you're building]
Tech Stack: [Next.js 15, TypeScript, Supabase, etc.]
Task: [Specific component/feature]
Requirements:

- [Requirement 1]
- [Requirement 2]
Constraints:
- [Use Server Actions, not API routes]
- [Follow shadcn patterns]
Code Style: [TypeScript, functional components, async/await]

```

### Example Cursor Prompts

**For Server Actions:**
```

Create a Server Action in app/actions/tasks.ts to update a task's status.
Use "use server" directive, accept taskId and newStatus parameters,
update in Supabase, revalidate /admin/dashboard path,
return {success: boolean, error?: string}.
Add TypeScript types and Zod validation.

```

**For Components:**
```

Create a TaskCard component in components/tasks/task-card.tsx.
Use shadcn Card, display task name, assignee name, priority badge, due date.
Make it draggable with @dnd-kit/sortable useSortable hook.
Add TypeScript interface for props. Style with Tailwind CSS.
Accept onEdit and onDelete callbacks.

```

**For Hooks:**
```

Create a custom hook hooks/use-tasks.ts that wraps React Query's useQuery.
Fetch tasks from Supabase, filter by status if provided,
sort by createdAt descending, enable realtime subscriptions,
return { tasks, isLoading, error, refetch }.
Add proper TypeScript types.

```

## File Structure
```

app/
├── actions/
│   ├── tasks.ts
│   ├── teams.ts
│   └── staff.ts
├── admin/
│   ├── dashboard/page.tsx
│   ├── tasks/page.tsx
│   ├── teams/page.tsx
│   └── staff/page.tsx
└── layout.tsx

components/
├── dashboard/
│   ├── stats-cards.tsx
│   └── tasks-table.tsx
├── tasks/
│   ├── kanban-board.tsx
│   ├── task-card.tsx
│   └── filter-bar.tsx
├── teams/
│   ├── create-team-dialog.tsx
│   └── teams-grid.tsx
├── staff/
│   ├── staff-form-dialog.tsx
│   └── staff-table.tsx
└── ui/ (shadcn components)

lib/
├── supabase/
│   ├── client.ts
│   └── server.ts
├── providers/
│   └── query-provider.tsx
└── utils.ts

stores/
└── ui-store.ts

hooks/
├── use-tasks.ts
├── use-optimistic-mutation.ts
├── use-realtime-tasks.ts
└── use-keyboard-shortcuts.ts

public/
├── manifest.json
├── icons/
└── sw.js (auto-generated)

```

## Key Performance Patterns

### 1. Server Actions Pattern
```

'use server'
export async function updateTask(id: string, data: TaskUpdate) {
const supabase = createServerClient()
const { error } = await supabase
.from('tasks')
.update(data)
.eq('id', id)

if (error) return { success: false, error: error.message }

revalidatePath('/admin/dashboard')
return { success: true }
}

```

### 2. Optimistic Update Pattern
```

const mutation = useMutation({
mutationFn: updateTask,
onMutate: async (newData) => {
await queryClient.cancelQueries({ queryKey: ['tasks'] })
const previous = queryClient.getQueryData(['tasks'])
queryClient.setQueryData(['tasks'], (old) =>
old.map(task => task.id === newData.id ? newData : task)
)
return { previous }
},
onError: (err, newData, context) => {
queryClient.setQueryData(['tasks'], context.previous)
}
})

```

### 3. Realtime Subscription Pattern
```

useEffect(() => {
const channel = supabase
.channel('tasks-changes')
.on('postgres_changes',
{ event: '*', schema: 'public', table: 'tasks' },
() => queryClient.invalidateQueries({ queryKey: ['tasks'] })
)
.subscribe()

return () => { supabase.removeChannel(channel) }
}, [])

```

## Completion Checklist

- [ ] PWA configured with offline support
- [ ] Service worker registered
- [ ] React Query provider setup
- [ ] Zustand store created
- [ ] All Server Actions implemented
- [ ] Dashboard page complete with stats and table
- [ ] Tasks page with drag-and-drop working
- [ ] Teams page with staff selection
- [ ] Staff page with CRUD operations
- [ ] Optimistic updates on all mutations
- [ ] Realtime subscriptions active
- [ ] Error boundaries in place
- [ ] Loading states for all async operations
- [ ] TypeScript types for all components
- [ ] Deployed to Vercel
- [ ] PWA installable on mobile devices

## Next Steps After Completion

1. Add unit tests with Vitest
2. Add E2E tests with Playwright
3. Implement role-based access control
4. Add task comments and attachments
5. Create reports and analytics dashboard
6. Add email notifications
7. Implement task templates
8. Add time tracking features
```

This guide maximizes Next.js 15 Server Actions for serverless architecture, eliminates unnecessary API routes, implements instant UI updates with optimistic patterns, and leverages Supabase Realtime for live data synchronization.[^5][^10][^1][^4][^8]
<span style="display:none">[^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40]</span>

<div align="center">⁂</div>

[^1]: https://nextjs.org/docs/14/app/building-your-application/data-fetching/server-actions-and-mutations

[^2]: https://nextjs.org/blog/next-15

[^3]: https://javascript.plainenglish.io/next-js-server-actions-explained-with-real-examples-you-can-copy-ae6ee172c2d8

[^4]: https://dev.to/sahilshityalkar/15-enhancing-user-experience-with-server-actions-in-nextjs-15-5dpn

[^5]: https://javascript.plainenglish.io/supercharge-your-ux-with-optimistic-updates-in-next-js-15-56541a19c305

[^6]: https://blog.scopethinkers.com/state-management-in-2025-redux-zustand-or-react-query/

[^7]: https://blog.logrocket.com/guide-state-management-next-js/

[^8]: https://anotherwrapper.com/blog/supabase-next-js

[^9]: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

[^10]: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs

[^11]: https://javascript.plainenglish.io/zustand-and-tanstack-query-the-dynamic-duo-that-simplified-my-react-state-management-e71b924efb90

[^12]: https://www.developerway.com/posts/react-state-management-2025

[^13]: https://dev.to/iamashot/supercharge-your-react-state-management-like-a-senior-dev-unlocking-the-power-of-zustand-and-react-query-5bap

[^14]: https://www.reddit.com/r/nextjs/comments/1gbolqg/which_state_management_solution_do_you_use_for/

[^15]: https://radzion.com/blog/kanban

[^16]: https://dndkit.com

[^17]: https://www.reddit.com/r/reactjs/comments/1g8h3c2/building_a_draganddrop_kanban_board_with_react/

[^18]: https://www.chetanverma.com/blog/how-to-create-an-awesome-kanban-board-using-dnd-kit

[^19]: https://nextjs.org/docs/app/guides/progressive-web-apps

[^20]: https://www.getfishtank.com/insights/creating-a-progressive-web-app-using-nextjs

[^21]: https://dev.to/wafa_bergaoui/integrating-pwa-in-a-nextjs-app-3a1

[^22]: https://nextjs.org/docs/app/getting-started/updating-data

[^23]: https://github.com/danielagg/shadcn-data-table-drag-n-drop-columns

[^24]: https://www.reddit.com/r/react/comments/13ttwxa/table_drag_and_drop/

[^25]: https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices

[^26]: https://www.youtube.com/watch?v=ipmfUw8I2qc

[^27]: https://www.youtube.com/watch?v=kHfDLN9w1KQ

[^28]: https://www.reddit.com/r/Supabase/comments/1chps52/nextjs_supabase_crud_authentication_rpc_database/

[^29]: https://github.com/zenoncao/shadcn-drag-table

[^30]: https://www.youtube.com/watch?v=ZyeqW42w6Ws

[^31]: https://ui.shadcn.com/docs/components/data-table

[^32]: https://ui.shadcn.com/docs/components/table

[^33]: https://www.freecodecamp.org/news/how-to-create-a-nextjs-pwa/

[^34]: https://www.youtube.com/watch?v=Yqj5Z-VOw5k

[^35]: https://www.reddit.com/r/nextjs/comments/1is8jig/trying_to_make_my_nextjs_15_app_into_a_pwa_but/

[^36]: https://javascript.plainenglish.io/building-a-progressive-web-app-pwa-in-next-js-with-serwist-next-pwa-successor-94e05cb418d7

[^37]: https://refine.dev/blog/next-js-pwa/

[^38]: https://www.youtube.com/watch?v=GEaRjSpgycg

[^39]: https://github.com/Muhammad-Faizan-Tariq/kanban-board-react-dnd-kit

[^40]: https://stackoverflow.com/questions/79342098/nextjs-react-query-zustand

