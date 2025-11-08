#!/bin/bash

# Start the FastAPI backend server
cd /Users/columbus/Desktop/hackPrinceton/backend/database

# Activate conda environment
eval "$(conda shell.bash hook)"
conda activate princeton

# Start uvicorn with proper module path
export PYTHONPATH=/Users/columbus/Desktop/hackPrinceton/backend:$PYTHONPATH
cd /Users/columbus/Desktop/hackPrinceton/backend
python -m uvicorn database.api.main:app --reload --host 0.0.0.0 --port 8000
