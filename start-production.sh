#!/bin/bash

# 🚴‍♂️ Rabbi E-Bike Management System - Production Start Script
# Questo script avvia l'applicazione in modalità produzione

set -e  # Exit on any error

echo "🚴‍♂️ Starting Rabbi E-Bike Management System in Production Mode"
echo "================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js version 16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Please upgrade to version 16 or higher."
    exit 1
fi

print_status "Node.js version $NODE_VERSION detected ✓"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi

print_status "npm detected ✓"

# Install frontend dependencies if needed
print_step "Checking frontend dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
else
    print_status "Frontend dependencies already installed ✓"
fi

# Build frontend for production
print_step "Building frontend for production..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Frontend build failed!"
    exit 1
fi

print_status "Frontend built successfully ✓"

# Install server dependencies if needed
print_step "Checking server dependencies..."
cd server

if [ ! -d "node_modules" ]; then
    print_status "Installing server dependencies..."
    npm install
else
    print_status "Server dependencies already installed ✓"
fi

# Create backups directory if it doesn't exist
if [ ! -d "backups" ]; then
    mkdir -p backups
    print_status "Created backups directory ✓"
fi

# Check if database exists, if not create it
if [ ! -f "rabbi_ebike.db" ]; then
    print_status "Database will be created on first startup ✓"
else
    print_status "Database found ✓"
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    mkdir -p logs
    print_status "Created logs directory ✓"
fi

cd ..

print_status "All checks completed successfully!"
echo ""
echo "================================================================"
echo -e "${GREEN}🚀 STARTING RABBI E-BIKE MANAGEMENT SYSTEM${NC}"
echo "================================================================"
echo ""
print_status "Server will start on: http://localhost:3001"
print_status "Frontend will be served from: http://localhost:8080"
print_status "Access the app at: http://localhost:8080"
echo ""
print_status "Features enabled:"
echo "  ✓ Automatic backups (every 24 hours)"
echo "  ✓ Database optimization (nightly at 3:00 AM)"
echo "  ✓ Performance monitoring"
echo "  ✓ Error logging"
echo ""
print_warning "To stop the system, press Ctrl+C"
echo ""

# Function to handle cleanup
cleanup() {
    print_status "Shutting down Rabbi E-Bike Management System..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    print_status "System shutdown complete."
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Start server in background
print_step "Starting backend server..."
cd server
npm start &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    print_error "Server failed to start!"
    exit 1
fi

print_status "Backend server started ✓ (PID: $SERVER_PID)"

# Start frontend production server
print_step "Starting frontend server..."
npm run preview &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Frontend failed to start!"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

print_status "Frontend server started ✓ (PID: $FRONTEND_PID)"

echo ""
echo "================================================================"
echo -e "${GREEN}🎉 SYSTEM READY!${NC}"
echo "================================================================"
echo ""
echo -e "📱 Access your Rabbi E-Bike Management System at:"
echo -e "   ${BLUE}http://localhost:8080${NC}"
echo ""
echo -e "🔧 Server API is running at:"
echo -e "   ${BLUE}http://localhost:3001${NC}"
echo ""
echo -e "📊 System monitoring available at:"
echo -e "   ${BLUE}http://localhost:8080/_perf/stats${NC}"
echo ""
echo -e "💾 Backups are automatically saved to:"
echo -e "   ${BLUE}./server/backups/${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the system${NC}"
echo ""

# Wait for both processes
wait $SERVER_PID $FRONTEND_PID