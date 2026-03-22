#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "🚀 Starting ClimaCrop (Full Stack)"
echo "=========================================="

# Kill existing processes
pkill -9 -f "uvicorn" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
sleep 1

# Start Main Backend (ClimaCrop API)
echo ""
echo "📦 Starting Main Backend..."
cd backend

if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo "🔍 Checking dependencies..."
if ! python -c "import fastapi" 2>/dev/null; then
    echo "⚠️  Installing missing dependencies..."
    pip install -r requirements.txt --quiet
fi

if ! python -c "import multipart" 2>/dev/null; then
    echo "⚠️  Installing python-multipart..."
    pip install python-multipart --quiet
fi

echo "Backend starting on http://127.0.0.1:8000"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

sleep 4

# Test backend
if curl -s http://127.0.0.1:8000/ | grep -q "ClimaCrop\|FastAPI"; then
    echo "✅ Backend is running!"
else
    echo "⚠️  Backend starting... (check backend.log if issues)"
fi

# Start Frontend
echo ""
echo "🎨 Starting Frontend..."
cd frotend

[ ! -d "node_modules" ] && npm install --silent > /dev/null 2>&1

echo "Frontend starting on http://localhost:5173"
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 5

# Wait for frontend to be ready
echo "⏳ Waiting for servers to be ready..."
for i in {1..10}; do
    if curl -s http://localhost:5173/ > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "=========================================="
echo "✅ All servers running!"
echo "=========================================="
echo ""
echo "Backend:                                http://127.0.0.1:8000"
echo "Frontend:                             http://localhost:5173"
echo ""
echo "Opening browser..."
sleep 2

# Try different methods to open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:5173 2>/dev/null &
elif command -v open > /dev/null; then
    open http://localhost:5173 2>/dev/null &
elif command -v start > /dev/null; then
    start http://localhost:5173 2>/dev/null &
else
    echo "⚠️  Could not auto-open browser. Please open http://localhost:5173 manually"
fi

echo ""
echo "Servers are running in the background!"
echo "Check logs: tail -f backend.log frontend.log"
echo "Stop servers: ./STOP.sh (if exists) or Ctrl+C"
echo ""

# Keep script running to maintain processes
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; pkill -f 'uvicorn'; pkill -f vite; exit" INT TERM

# Wait for processes
wait
