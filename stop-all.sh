#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}🛑 Stopping all services...${NC}\n"

# Stop by PIDs
if [ -f .backend.pid ]; then
    kill $(cat .backend.pid) 2>/dev/null && echo -e "${GREEN}✅ Backend stopped${NC}"
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    kill $(cat .frontend.pid) 2>/dev/null && echo -e "${GREEN}✅ Frontend stopped${NC}"
    rm .frontend.pid
fi

if [ -f .agent.pid ]; then
    kill $(cat .agent.pid) 2>/dev/null && echo -e "${GREEN}✅ Agent stopped${NC}"
    rm .agent.pid
fi

# Kill any remaining processes on ports
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
pkill -f "node photon.js" 2>/dev/null

echo -e "\n${GREEN}All services stopped!${NC}"
