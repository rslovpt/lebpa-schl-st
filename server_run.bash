#!/bin/bash
source ~/website/venv/bin/activate

echo "Starting backend server..."
# Start backend.py in background
python3 ./Server/backend.py &

# Wait 5 seconds
sleep 5

echo "Starting ngrok tunnel..."
# Make sure ngrok is in PATH or use full path
ngrok http 5000 &

# Wait 5 seconds
sleep 5

# Fetch public ngrok URL
URL=$(curl --silent http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"[^"]*' | head -n 1 | cut -d'"' -f4)

echo "Your public ngrok URL is $URL"