#!/bin/bash

echo "=========================================="
echo "🚀 Starting ClimaCrop"
echo "=========================================="

# Kill existing processes
pkill -9 -f "uvicorn" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
sleep 1

# Start Backend
echo ""
echo "📦 Starting Backend..."
cd backend

# Activate virtual environment
source venv/bin/activate

# Check and install dependencies if needed
echo "🔍 Checking dependencies..."
if ! python -c "import fastapi" 2>/dev/null; then
    echo "⚠️  Installing missing dependencies..."
    pip install -r requirements.txt --quiet
fi

# Verify python-multipart is installed (required for file uploads)
if ! python -c "import multipart" 2>/dev/null; then
    echo "⚠️  Installing python-multipart (required for file uploads)..."
    pip install python-multipart --quiet
fi

echo "Backend starting on http://127.0.0.1:8000"
venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 3

# Test backend
if curl -s http://127.0.0.1:8000/ | grep -q "ClimaCrop\|FastAPI"; then
    echo "✅ Backend is running!"
else
    echo "⚠️  Backend starting... (check backend.log if issues)"
fi

# Start Frontend
# Note: Directory name "frotend" contains a typo but is kept for compatibility
echo ""
echo "🎨 Starting Frontend..."
cd frotend

[ ! -d "node_modules" ] && npm install --silent > /dev/null 2>&1

echo "Frontend starting on http://localhost:3000 (configured in vite.config.js)"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 5

# Wait for frontend to be ready
echo "⏳ Waiting for servers to be ready..."
for i in {1..10}; do
    if curl -s http://localhost:3000/ > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "=========================================="
echo "✅ Both servers running!"
echo "=========================================="
echo ""
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Opening browser..."
sleep 2

# Try different methods to open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000 2>/dev/null &
elif command -v open > /dev/null; then
    open http://localhost:3000 2>/dev/null &
elif command -v start > /dev/null; then
    start http://localhost:3000 2>/dev/null &
else
    echo "⚠️  Could not auto-open browser. Please open http://localhost:3000 manually"
fi

echo ""
echo "Servers are running in the background!"
echo "Check logs: tail -f backend.log frontend.log"
echo "Stop servers: ./STOP.sh"
echo ""

# Keep script running to maintain processes
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; pkill -f 'uvicorn main:app'; pkill -f vite; exit" INT TERM

# Wait for processes
wait
