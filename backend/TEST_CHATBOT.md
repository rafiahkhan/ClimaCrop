# Testing the Chatbot with Anaconda

## Step 1: Set Up Conda Environment

### Option A: Use Existing Environment
If you already have a conda environment for this project:

```bash
# Activate your conda environment
conda activate <your_environment_name>

# Navigate to backend directory
cd backend
```

### Option B: Create New Environment
If you need a new environment:

```bash
# Create new conda environment with Python 3.10+
conda create -n climacrop python=3.10
conda activate climacrop

# Navigate to backend directory
cd backend
```

## Step 2: Install Dependencies

```bash
# Install all dependencies including new chatbot ones
pip install -r requirements.txt

# Or install individually if needed:
pip install google-generativeai chromadb pandas python-dotenv
```

## Step 3: Verify Installation

```bash
# Check if all packages are installed
python -c "import google.generativeai; import chromadb; import pandas; print('✅ All packages installed!')"
```

## Step 4: Start the Backend

```bash
# Make sure you're in the backend directory
cd backend

# Start the backend server
python main.py

# OR using uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:
```
🔄 Initializing Chatbot RAG Pipeline on startup...
📖 Reading CSV from: ...
✅ Loaded X documents from CSV
✅ Split into X chunks
✅ Created ChromaDB collection with X chunks
✅ Chatbot RAG Pipeline initialized successfully!
✅ Chatbot initialized successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Step 5: Test the Endpoints

### Test 1: Health Check
Open a new terminal (keep backend running) and run:

```bash
# Windows PowerShell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/chatbot/health" -Method GET

# Or using curl (if installed)
curl http://127.0.0.1:8000/api/chatbot/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "initialized": true,
  "model": "gemini-1.5-flash",
  "vectordb_ready": true
}
```

### Test 2: Simple Chat Query
```bash
# Windows PowerShell
$body = @{
    query = "What crops are available for summer season?"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/chatbot/chat" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Or using curl:**
```bash
curl -X POST http://127.0.0.1:8000/api/chatbot/chat \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"What crops are available for summer season?\"}"
```

### Test 3: Test with Python Script

Create a test file `test_chatbot.py` in the backend directory:

```python
import requests
import json

# Test health endpoint
print("Testing Health Endpoint...")
response = requests.get("http://127.0.0.1:8000/api/chatbot/health")
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
print()

# Test chat endpoint
print("Testing Chat Endpoint...")
chat_data = {
    "query": "What is the average yield for Cotton in summer season?"
}

response = requests.post(
    "http://127.0.0.1:8000/api/chatbot/chat",
    json=chat_data
)

print(f"Status: {response.status_code}")
result = response.json()
print(f"Query: {result.get('query')}")
print(f"Response: {result.get('response')}")
print(f"Context Used: {result.get('context_used')} chunks")
print(f"Processing Time: {result.get('processing_time')} seconds")
```

Run it:
```bash
python test_chatbot.py
```

## Step 6: Test via Browser/Postman

### Using Browser
1. Open: `http://127.0.0.1:8000/docs`
2. This opens the FastAPI interactive docs (Swagger UI)
3. Find `/api/chatbot/chat` endpoint
4. Click "Try it out"
5. Enter a query like: `"What crops grow best in summer?"`
6. Click "Execute"

### Using Postman
1. Create a new POST request
2. URL: `http://127.0.0.1:8000/api/chatbot/chat`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "query": "Tell me about cotton farming recommendations"
   }
   ```
5. Send request

## Troubleshooting

### Issue: ModuleNotFoundError
**Solution:** Make sure you're in the conda environment and dependencies are installed:
```bash
conda activate <your_env>
pip install -r requirements.txt
```

### Issue: CSV file not found
**Solution:** Make sure `all_crops_validated.csv` is in the root directory (one level up from backend):
```
ClimaCrop/
├── all_crops_validated.csv  ← Should be here
├── backend/
│   ├── chatbot.py
│   └── main.py
```

### Issue: VectorDB path error
**Solution:** The VectorDB will be created automatically in `backend/vectordb/`. Make sure the backend directory is writable.

### Issue: Gemini API errors
**Solution:** Check that the API key is correct. The default key is hardcoded in `chatbot.py`, but you can override with environment variables.

### Issue: Timeout errors
**Solution:** Increase timeout in `chatbot.py` or set `CHATBOT_REQUEST_TIMEOUT` environment variable to a higher value (default is 30 seconds).

## Sample Test Queries

Try these queries to test different aspects:

1. **General crop information:**
   - "What crops are available?"
   - "Tell me about cotton farming"

2. **Season-specific:**
   - "What crops grow in summer?"
   - "Best crops for winter season"

3. **Location-specific:**
   - "What crops are grown in Bahawalnagar district?"
   - "Best crops for loamy soil"

4. **Yield and revenue:**
   - "What is the average yield for rice?"
   - "Which crop has the highest revenue?"

5. **Fertilizer recommendations:**
   - "What fertilizer should I use for cotton?"
   - "NPK recommendations for maize"

## Expected Behavior

✅ **Success indicators:**
- Health endpoint returns `"status": "healthy"`
- Chat endpoint returns responses with relevant crop data
- Responses include information from the CSV file
- Processing time is reasonable (< 30 seconds)

❌ **Error indicators:**
- Health endpoint returns `"status": "unavailable"` → Check dependencies
- Chat endpoint returns 408 (timeout) → Query might be too complex
- Chat endpoint returns 503 → Chatbot not initialized, check backend logs
