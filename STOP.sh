#!/bin/bash

echo "=========================================="
echo "🛑 Stopping ClimaCrop Servers"
echo "=========================================="
echo ""

# Stop Backend
echo "📦 Stopping Backend..."
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "uvicorn" 2>/dev/null

# Stop Frontend
echo "🎨 Stopping Frontend..."
pkill -f "vite" 2>/dev/null

sleep 2

# Check if processes are still running
BACKEND_RUNNING=$(pgrep -f "uvicorn main:app" 2>/dev/null || pgrep -f "uvicorn" 2>/dev/null)
FRONTEND_RUNNING=$(pgrep -f "vite" 2>/dev/null)

if [ -z "$BACKEND_RUNNING" ] && [ -z "$FRONTEND_RUNNING" ]; then
    echo "✅ All servers stopped successfully!"
else
    echo "⚠️  Some processes may still be running:"
    [ -n "$BACKEND_RUNNING" ] && echo "   Backend PID: $BACKEND_RUNNING"
    [ -n "$FRONTEND_RUNNING" ] && echo "   Frontend PID: $FRONTEND_RUNNING"
    echo ""
    echo "Force stopping..."
    pkill -9 -f "uvicorn" 2>/dev/null
    pkill -9 -f "vite" 2>/dev/null
    sleep 1
    echo "✅ Force stopped all processes"
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
