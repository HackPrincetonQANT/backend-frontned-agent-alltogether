#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Backend + Frontend + Agent...${NC}\n"

# Kill any existing processes on ports 8000, 5173, and 3001
echo -e "${YELLOW}Cleaning up old processes...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
pkill -f "node photon.js" 2>/dev/null || true

# Start Backend
echo -e "${GREEN}Starting Backend on http://localhost:8000${NC}"
cd backend
eval "$(conda shell.bash hook)"
conda activate princeton
python -m uvicorn database.api.main:app --reload --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 3

# Start Frontend
echo -e "${GREEN}Starting Frontend on http://localhost:5173${NC}"
cd clerk-react
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 2

# Start Agent
echo -e "${GREEN}Starting Piggy Agent on http://localhost:3001${NC}"
cd agent
npm start > ../agent.log 2>&1 &
AGENT_PID=$!
cd ..

sleep 2

echo -e "\n${GREEN}✅ All services started!${NC}"
echo -e "${BLUE}Backend:${NC}  http://localhost:8000 (PID: $BACKEND_PID)"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173 (PID: $FRONTEND_PID)"
echo -e "${BLUE}Agent:${NC}    http://localhost:3001 (PID: $AGENT_PID)"
echo -e "\n${YELLOW}Logs:${NC}"
echo -e "  Backend:  tail -f backend.log"
echo -e "  Frontend: tail -f frontend.log"
echo -e "  Agent:    tail -f agent.log"
echo -e "\n${YELLOW}To stop all:${NC} ./stop-all.sh"
echo -e "${YELLOW}Or manually:${NC} kill $BACKEND_PID $FRONTEND_PID $AGENT_PID\n"

# Save PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid
echo $AGENT_PID > .agent.pid
