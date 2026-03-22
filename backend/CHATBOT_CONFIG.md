# Chatbot Configuration

## Environment Variables

The chatbot module supports the following environment variables. You can create a `.env` file in the `backend/` directory or set these as system environment variables.

### Required Configuration

```env
# Gemini API Configuration
GEMINI_API_KEY=AIzaSyBcuhuoRJCVURnmoj_0_qu98MS-znCwPD4
GEMINI_PROJECT_NAME=projects/1033197292353
GEMINI_PROJECT_NUMBER=1033197292353
```

### Optional Configuration

```env
# Gemini Model Configuration
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2048

# Request Timeout Configuration (seconds)
CHATBOT_REQUEST_TIMEOUT=30

# VectorDB Configuration
VECTORDB_PATH=./vectordb
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

**Note:** If no `.env` file is created, the chatbot will use the default values defined in `chatbot.py`.

## API Endpoints

- `POST /api/chatbot/chat` - Main chat endpoint
- `GET /api/chatbot/health` - Check chatbot health/status

## Usage

The chatbot automatically initializes on backend startup. The CSV file (`all_crops_validated.csv`) is loaded into ChromaDB VectorDB for RAG (Retrieval Augmented Generation).

Deadlock prevention: Each request has a 30-second timeout. If a new request comes in for the same session, the previous request is automatically cancelled.
