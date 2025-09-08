# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a full-stack bike rental management application for Rabbi E-Bike with:

**Frontend**: React 18 + TypeScript + Vite app using shadcn/ui components and Tailwind CSS
- Main entry: `src/main.tsx` → `src/App.tsx` → `src/pages/Index.tsx`  
- Components in `src/components/` (UI components in `src/components/ui/`)
- API service layer in `src/services/api.ts`
- Type definitions in `src/types/bike.ts`
- Uses React Router, React Query, and React Hook Form

**Backend**: Node.js Express server with SQLite database
- Server code: `server/server.js`
- Local SQLite database: `rabbi_ebike.db`
- API endpoints under `/api/*`
- Automatic backups in `backups/` folder

## Commands

### Frontend Development
```bash
npm install          # Install dependencies
npm run dev         # Start dev server (localhost:8080)
npm run build       # Production build
npm run build:dev   # Development build
npm run lint        # Run ESLint
npm run preview     # Preview production build
```

### Backend Server
```bash
cd server
npm install         # Install server dependencies  
npm run dev         # Start server with nodemon (localhost:3001)
npm start          # Start server in production mode
```

### Full Stack Development
1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Access app at http://localhost:8080

## Key Architecture Details

**API Communication**: Frontend communicates with backend server on `localhost:3001/api`

**State Management**: 
- React Query for server state
- React Hook Form for form state
- Context/props for component state

**UI Components**: Built with shadcn/ui (Radix primitives + Tailwind)

**Database Schema** (SQLite):
- `settings` - Shop configuration
- `bikes` - Bike inventory 
- `bookings` - Rental bookings
- `booking_bikes` - Many-to-many relationship
- `server_config` - Server settings

**Bike Types**: `bambino | adulto | carrello-porta-bimbi | trailer`

**Key Features**:
- Bike rental booking system
- Garage management for bike inventory
- Statistics and dashboard
- Settings panel for shop configuration  
- Developer panel for server management
- Backup/restore functionality