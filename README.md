# ProUltima Task Manager PWA

A modern Progressive Web Application for task management built with Next.js 15, featuring a dashboard, task management with drag-and-drop, team management, staff management, and reporting capabilities.

## 🚀 Features

- **Progressive Web App (PWA)** - Installable on mobile devices with offline capabilities
- **Modern Dashboard** - Real-time statistics and task overview
- **Drag & Drop Tasks** - Kanban-style task management
- **Team Management** - Create teams and assign staff members
- **Staff Management** - Complete CRUD operations for staff
- **Real-time Updates** - Live data synchronization with Supabase
- **Optimistic Updates** - Instant UI feedback for better UX
- **Responsive Design** - Works on desktop and mobile devices

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **State Management**: React Query + Zustand
- **Drag & Drop**: @dnd-kit
- **PWA**: @ducanh2912/next-pwa
- **Notifications**: Sonner

## 📁 Project Structure

```
src/
├── app/
│   ├── actions/           # Server Actions
│   ├── admin/            # Admin pages
│   │   ├── dashboard/    # Dashboard page
│   │   ├── tasks/        # Tasks page
│   │   ├── teams/        # Teams page
│   │   ├── staff/        # Staff page
│   │   └── reports/      # Reports page
│   └── layout.tsx        # Root layout
├── components/
│   ├── dashboard/        # Dashboard components
│   ├── tasks/           # Task-related components
│   ├── teams/           # Team components
│   ├── staff/           # Staff components
│   ├── reports/         # Report components
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
├── lib/
│   ├── providers/       # React Query provider
│   ├── supabase/        # Supabase clients
│   └── utils.ts         # Utility functions
├── stores/              # Zustand stores
└── types/               # TypeScript types
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pro-ultima-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Set up the database tables (see Database Schema section)
   - Configure Row Level Security (RLS) policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES staff(id),
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  repeat TEXT DEFAULT 'none',
  team_id UUID REFERENCES teams(id)
);
```

### Staff Table
```sql
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Teams Table
```sql
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  captain_id UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Team Members Table
```sql
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, staff_id)
);
```

## 🎯 Development Phases

This project follows a structured development approach with 15 phases:

1. ✅ **Project Initialization** - Next.js 15 setup with dependencies
2. ✅ **PWA Configuration** - Service worker, manifest, offline capabilities
3. ⏳ **Supabase Setup** - Database, authentication, real-time features
4. ⏳ **State Management** - React Query + Zustand + Server Actions
5. ⏳ **Server Actions** - CRUD operations without API routes
6. ⏳ **Dashboard Page** - Stats cards and data table
7. ⏳ **Tasks Page** - Drag & drop kanban board
8. ⏳ **Teams Page** - Team creation with staff selection
9. ⏳ **Staff Page** - Staff management with CRUD
10. ⏳ **Reports Page** - Analytics and reporting
11. ⏳ **Optimistic Updates** - Instant UI feedback
12. ⏳ **Performance Optimization** - Loading states, caching
13. ⏳ **PWA Features** - Offline, install prompts
14. ⏳ **Testing & QA** - Component and PWA testing
15. ⏳ **Deployment** - Production setup and monitoring

## 📱 PWA Features

- **Offline Support** - Works without internet connection
- **Installable** - Can be installed on mobile devices
- **App-like Experience** - Standalone display mode
- **Push Notifications** - Real-time updates (optional)
- **Service Worker** - Background sync and caching

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Phase 1 Complete** ✅ - Project initialized with Next.js 15, PWA configuration, and basic structure setup.