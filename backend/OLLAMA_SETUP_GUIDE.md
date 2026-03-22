# Step-by-Step Guide: Replacing Gemini with Ollama (llama3:8b)

## Prerequisites
- ✅ Ollama installed on your system
- ✅ llama3:8b model downloaded (`ollama pull llama3:8b`)

---

## Step 1: Verify Ollama is Running

Open PowerShell/Terminal and run:

```powershell
# Check if Ollama is running
ollama list

# If not running, start Ollama server
ollama serve
```

**Expected output:** You should see your models listed, including `llama3:8b`

---

## Step 2: Test Ollama Model

Test that the model works:

```powershell
ollama run llama3:8b "Hello, can you respond in English and Urdu?"
```

**Expected:** You should get a response from the model.

---

## Step 3: Install Python Dependencies

Navigate to your backend folder and install the new package:

```powershell
cd C:\FAST_2021\ClimaCrop_dup\ClimaCrop\backend
conda activate pymc_env
pip install ollama requests
```

Or install from requirements.txt:

```powershell
pip install -r requirements.txt
```

---

## Step 4: Verify Code Changes

The following files have been updated:
- ✅ `requirements.txt` - Added `ollama>=0.1.0` and `requests>=2.31.0`
- ✅ `chatbot.py` - Replaced Gemini API calls with Ollama
- ✅ `main.py` - Updated health endpoint and documentation

---

## Step 5: Configure Environment Variables (Optional)

Create or update `.env` file in `backend/` folder:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b
OLLAMA_TEMPERATURE=0.7
OLLAMA_MAX_TOKENS=2048
CHATBOT_REQUEST_TIMEOUT=60
```

**Note:** Default values are already set in code, so this step is optional.

---

## Step 6: Restart Your Backend Server

Stop your current server (Ctrl+C) and restart:

```powershell
cd C:\FAST_2021\ClimaCrop_dup\ClimaCrop\backend
conda activate pymc_env
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Watch for these messages:**
- ✅ `🔍 Checking Ollama connection at http://localhost:11434...`
- ✅ `✅ Model 'llama3:8b' is available and responding`
- ✅ `✅ Ollama model 'llama3:8b' initialized successfully`

---

## Step 7: Test the Chatbot

### Option A: Via Swagger UI
1. Go to `http://localhost:8000/docs`
2. Find `POST /api/chatbot/chat`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "query": "What crops grow best in Bahawalnagar?",
     "language": "en"
   }
   ```
5. Click "Execute"

### Option B: Check Health Endpoint
Visit: `http://localhost:8000/api/chatbot/health`

**Expected response:**
```json
{
  "status": "healthy",
  "initialized": true,
  "model": "llama3:8b",
  "vectordb_ready": true
}
```

---

## Step 8: Test English and Urdu Responses

### English Test:
```json
{
  "query": "Tell me about cotton farming in Pakistan",
  "language": "en"
}
```

### Urdu Test:
```json
{
  "query": "پاکستان میں کپاس کی کاشت کے بارے میں بتائیں",
  "language": "ur"
}
```

**Expected:** Model should respond in the requested language.

---

## Troubleshooting

### Issue: "Ollama model 'llama3:8b' not available"
**Solution:**
```powershell
# Make sure Ollama is running
ollama serve

# Pull the model if not already downloaded
ollama pull llama3:8b

# Verify model exists
ollama list
```

### Issue: "Connection refused" or "Connection error"
**Solution:**
- Make sure Ollama server is running: `ollama serve`
- Check if port 11434 is accessible
- Verify `OLLAMA_BASE_URL` in `.env` matches your Ollama server URL

### Issue: Slow responses
**Solution:**
- Local models are slower than cloud APIs
- Increase `CHATBOT_REQUEST_TIMEOUT` to 120 seconds in `.env`
- Consider using a GPU-accelerated Ollama installation

### Issue: Model not responding in Urdu
**Solution:**
- The prompt includes Urdu instructions, but model quality may vary
- Try rephrasing the question
- Ensure the model supports multilingual responses (llama3:8b should support Urdu)

---

## Key Differences from Gemini

| Feature | Gemini (Before) | Ollama (Now) |
|---------|----------------|--------------|
| **Location** | Cloud API | Local (your machine) |
| **Internet** | Required | Not required |
| **Speed** | Fast | Slower (depends on hardware) |
| **Cost** | API costs | Free |
| **Privacy** | Data sent to Google | Data stays local |
| **Timeout** | 30 seconds | 60 seconds (configurable) |

---

## Summary

✅ **What Changed:**
- Replaced `google-generativeai` with `ollama` Python package
- Updated `chatbot.py` to use Ollama API instead of Gemini
- Maintained English and Urdu language support
- Updated health endpoint to show correct model name

✅ **What Stayed the Same:**
- RAG pipeline (ChromaDB vector database)
- CSV data loading
- Language switching (English/Urdu)
- All API endpoints remain the same

✅ **Benefits:**
- No API costs
- Data privacy (runs locally)
- No internet required
- Full control over the model

---

## Next Steps

1. Test the chatbot thoroughly with various questions
2. Monitor response times and quality
3. Adjust `OLLAMA_TEMPERATURE` if responses are too creative/conservative
4. Consider fine-tuning the prompts in `chatbot.py` for better Urdu responses

---

**Need Help?** Check the console logs when starting the server - they will show any initialization errors.
