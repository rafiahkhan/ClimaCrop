"""
Chatbot Module with RAG Pipeline using Google Gemini API and ChromaDB Vector Database
"""
import os
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
import chromadb
import pandas as pd
import google.generativeai as genai

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Gemini Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBcuhuoRJCVURnmoj_0_qu98MS-znCwPD4")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
GEMINI_MAX_TOKENS = int(os.getenv("GEMINI_MAX_TOKENS", "2048"))
REQUEST_TIMEOUT = int(os.getenv("CHATBOT_REQUEST_TIMEOUT", "60"))

# VectorDB Configuration
VECTORDB_PATH = os.getenv("VECTORDB_PATH", "./vectordb")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))

# Global variables for VectorDB and active requests
vector_store = None
active_requests: Dict[str, asyncio.Task] = {}


class ChatbotRAG:
    """RAG Pipeline for ClimaCrop Chatbot"""
    
    def __init__(self, csv_path: str = "../all_crops_validated.csv"):
        self.csv_path = csv_path
        self.vector_store = None
        self.embeddings = None
        self.model = None
        self._gemini_model = None
        self.initialized = False
        
    def initialize(self):
        """Initialize the RAG pipeline - Load CSV, create embeddings, and setup VectorDB"""
        try:
            print("🔄 Initializing Chatbot RAG Pipeline...")
            
            # Load and process CSV data
            documents = self._load_csv_to_documents()
            print(f"✅ Loaded {len(documents)} documents from CSV")
            
            # Split documents into chunks manually
            splits = self._split_documents(documents)
            print(f"✅ Split into {len(splits)} chunks")
            
            # Create or load VectorDB using ChromaDB's default embedding
            client = chromadb.PersistentClient(path=VECTORDB_PATH)
            
            # Try to delete existing collection if it exists, then create fresh one
            try:
                client.delete_collection(name="climacrop_data")
                print("🔄 Cleared existing collection")
            except:
                pass
            
            collection = client.create_collection(
                name="climacrop_data",
                metadata={"description": "ClimaCrop crop data for RAG"}
            )
            
            # Add documents to ChromaDB
            texts = [doc["content"] for doc in splits]
            metadatas = [doc["metadata"] for doc in splits]
            ids = [f"doc_{i}" for i in range(len(splits))]
            
            # Add in batches to avoid memory issues
            batch_size = 100
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i+batch_size]
                batch_metadatas = metadatas[i:i+batch_size]
                batch_ids = ids[i:i+batch_size]
                
                collection.add(
                    documents=batch_texts,
                    metadatas=batch_metadatas,
                    ids=batch_ids
                )
            
            self.vector_store = collection
            print(f"✅ Created ChromaDB collection with {len(splits)} chunks")
            
            # Initialize Gemini API
            model_name = GEMINI_MODEL
            try:
                print(f"🔍 Configuring Gemini API (model: {model_name})...")
                genai.configure(api_key=GEMINI_API_KEY)
                generation_config = {
                    "temperature": GEMINI_TEMPERATURE,
                    "max_output_tokens": GEMINI_MAX_TOKENS,
                }
                self._gemini_model = genai.GenerativeModel(
                    model_name=model_name,
                    generation_config=generation_config,
                )
                # Test API with a short generation
                self._gemini_model.generate_content("Say OK")
                self.model = model_name
                print(f"✅ Gemini model '{model_name}' initialized successfully")
            except Exception as e:
                print(f"❌ Error initializing Gemini: {e}")
                raise
            
            self.initialized = True
            print("✅ Chatbot RAG Pipeline initialized successfully!")
            
        except Exception as e:
            print(f"❌ Error initializing Chatbot RAG: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _split_documents(self, documents: List[Dict]) -> List[Dict]:
        """Split documents into chunks"""
        splits = []
        
        for doc in documents:
            content = doc["content"]
            metadata = doc["metadata"]
            
            # Simple text splitting
            words = content.split()
            chunk_size_words = CHUNK_SIZE // 5  # Approximate words (avg 5 chars/word)
            overlap_words = CHUNK_OVERLAP // 5
            
            for i in range(0, len(words), chunk_size_words - overlap_words):
                chunk_words = words[i:i + chunk_size_words]
                chunk_text = " ".join(chunk_words)
                
                if chunk_text.strip():
                    splits.append({
                        "content": chunk_text,
                        "metadata": {**metadata, "chunk_index": len(splits)}
                    })
        
        return splits
    
    def _load_csv_to_documents(self) -> List[Dict]:
        """Load CSV file and convert to documents"""
        documents = []
        
        try:
            # Try to read CSV file
            csv_abs_path = os.path.abspath(self.csv_path)
            if not os.path.exists(csv_abs_path):
                # Try alternative paths
                alternative_paths = [
                    "./all_crops_validated.csv",
                    "../all_crops_validated.csv",
                    os.path.join(os.path.dirname(__file__), "../all_crops_validated.csv")
                ]
                for alt_path in alternative_paths:
                    if os.path.exists(alt_path):
                        csv_abs_path = os.path.abspath(alt_path)
                        break
                else:
                    raise FileNotFoundError(f"CSV file not found at {self.csv_path}")
            
            print(f"📖 Reading CSV from: {csv_abs_path}")
            
            # Read CSV with pandas for better handling
            df = pd.read_csv(csv_abs_path)
            
            # Convert each row to a document
            for idx, row in df.iterrows():
                # Create a readable text representation of the row
                doc_text = self._row_to_text(row)
                
                # Create metadata
                metadata = {
                    "row_index": idx,
                    "crop": str(row.get("Crop", "Unknown")),
                    "district": str(row.get("district", "Unknown")),
                    "year": str(row.get("Year", "Unknown")),
                    "season": str(row.get("Season", "Unknown"))
                }
                
                documents.append({
                    "content": doc_text,
                    "metadata": metadata
                })
            
            return documents
            
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _row_to_text(self, row: pd.Series) -> str:
        """Convert a CSV row to readable text format"""
        text_parts = []
        
        # Key fields to include
        key_fields = {
            "Crop": "Crop",
            "Variety": "Variety",
            "district": "District",
            "Season": "Season",
            "Year": "Year",
            "Soil_Type": "Soil Type",
            "Temperature_Category": "Temperature Category",
            "Fertilizer_Type": "Fertilizer Type",
            "Recommended_Pesticide": "Recommended Pesticide",
            "Expected_Disease": "Expected Disease",
            "Avg_Yield_kg_per_acre": "Average Yield (kg/acre)",
            "Avg_Price_PKR": "Average Price (PKR)",
            "expected_revenue": "Expected Revenue",
            "climate_score": "Climate Score",
            "climate_effect_percent": "Climate Effect (%)",
            "temperature": "Temperature (°C)",
            "rainfall": "Rainfall (mm)",
            "humidity": "Humidity (%)",
            "N": "Nitrogen (N)",
            "P": "Phosphorus (P)",
            "K": "Potassium (K)",
            "ph": "pH Level"
        }
        
        text_parts.append(f"Crop Information for {row.get('Crop', 'Unknown Crop')}:")
        
        for key, label in key_fields.items():
            value = row.get(key)
            if pd.notna(value) and value != "":
                text_parts.append(f"{label}: {value}")
        
        return "\n".join(text_parts)
    
    async def search_relevant_context(self, query: str, k: int = 5) -> List[str]:
        """Search for relevant context from VectorDB"""
        if not self.initialized or self.vector_store is None:
            return []
        
        try:
            # Use ChromaDB query (it will use default embedding function)
            results = self.vector_store.query(
                query_texts=[query],
                n_results=k
            )
            
            if results and 'documents' in results and results['documents']:
                return results['documents'][0]
            else:
                return []
            
        except Exception as e:
            print(f"⚠️ Error searching VectorDB: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def generate_response(self, user_query: str, context: List[str], request_id: str, language: str = "en") -> str:
        """Generate response using Google Gemini with RAG context."""
        try:
            # Build context prompt
            context_text = "\n\n".join([
                f"[Context {i+1}]\n{ctx}"
                for i, ctx in enumerate(context)
            ])
            
            # Create prompt with context - adjust based on language
            if language == "ur":
                # Urdu prompt - **force native Urdu script, no Roman Urdu**
                prompt = f"""آپ ClimaCrop کے لیے ایک مددگار زرعی معاون ہیں۔ آپ مختلف طرح کے سوالات کے جواب دے سکتے ہیں:

1. زرعی سوالات: فصلوں کے ڈیٹا بیس سے معلومات استعمال کریں۔
2. عام گفتگو: "آپ کیسے ہیں؟" جیسے سوالات کا دوستانہ اور مختصر جواب دیں۔
3. موسم کے سوالات: live موسم کا ڈیٹا موجود نہیں، لیکن ڈیٹا بیس سے عام آب و ہوا (درجہ حرارت، بارش، نمی) اور کسی مقام پر فصل کی مناسبیت کے بارے میں بتائیں۔

نیچے آپ کو ClimaCrop ڈیٹا بیس سے اہم سیاق و سباق دیا گیا ہے۔ ان جملوں کو غور سے پڑھیں اور انہی کے مطابق جواب تیار کریں:
{context_text}

صارف کا سوال (user question):
{user_query}

ہدایات برائے جواب:
- جواب مکمل طور پر **اردو رسم الخط** میں لکھیں، رومن اردو (English letters) استعمال نہ کریں۔
- اگر سوال انگریزی یا رومن اردو میں ہو تب بھی جواب سیدھی، آسان اور واضح اردو میں دیں۔
- 2–4 جملوں میں مختصر مگر معلوماتی جواب دیں۔
- اگر کسی بات کا ڈیٹا میں ذکر نہیں تو واضح طور پر لکھیں کہ "اس کے بارے میں میرے پاس موجود ڈیٹا میں معلومات نہیں" اور اندازہ نہ لگائیں۔

براہ کرم حتمی جواب صرف اردو متن میں دیں، کسی قسم کی وضاحت انگریزی میں شامل نہ کریں۔"""
            else:
                # English prompt
                prompt = f"""You are a helpful agricultural assistant for ClimaCrop. You can answer various types of questions:

1. Agricultural questions: Use the crop database context below
2. General conversation: Answer friendly questions like "How are you?" in a warm, brief way
3. Weather questions: You don't have live weather data, but use the database to describe typical climate (temperature, rainfall) for locations like Bahawalnagar and whether conditions are generally suitable for crops like cotton

Context from ClimaCrop Database:
{context_text}

User Question: {user_query}

Keep your answer brief: 2-3 sentences. Be friendly. For weather questions, say you don't have live weather but can share typical climate and crop suitability from our data."""

            # Call Gemini API with timeout
            response = await asyncio.wait_for(
                self._call_gemini_async(prompt, language),
                timeout=REQUEST_TIMEOUT
            )
            
            return response
            
        except asyncio.TimeoutError:
            raise TimeoutError(f"Request timed out after {REQUEST_TIMEOUT} seconds")
        except Exception as e:
            print(f"❌ Error generating response: {e}")
            raise
    
    async def _call_gemini_async(self, prompt: str, language: str = "en") -> str:
        """Async wrapper for Gemini API call"""
        loop = asyncio.get_event_loop()

        def call_gemini():
            try:
                response = self._gemini_model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
                return ""
            except Exception as e:
                print(f"❌ Gemini API error: {e}")
                if language == "ur":
                    return "معذرت، میں جواب نہیں دے سکا۔ براہ کرم دوبارہ کوشش کریں۔"
                else:
                    return "I'm sorry, I couldn't generate a response. Please try again."

        response_text = await loop.run_in_executor(None, call_gemini)

        if response_text:
            return response_text
        else:
            if language == "ur":
                return "معذرت، میں جواب نہیں دے سکا۔ براہ کرم دوبارہ کوشش کریں۔"
            else:
                return "I'm sorry, I couldn't generate a response. Please try again."
    
    async def chat(self, user_query: str, request_id: str, language: str = "en") -> Dict[str, any]:
        """
        Main chat method with deadlock prevention
        Returns response with metadata
        """
        start_time = datetime.now()
        
        try:
            # Cancel previous request for this user if exists
            if request_id in active_requests:
                old_task = active_requests[request_id]
                if not old_task.done():
                    old_task.cancel()
                    print(f"⏹️ Cancelled previous request for {request_id}")
            
            # Create new task
            task = asyncio.create_task(self._process_chat_request(user_query, request_id, language))
            active_requests[request_id] = task
            
            # Wait for response with timeout
            response_data = await asyncio.wait_for(
                task,
                timeout=REQUEST_TIMEOUT
            )
            
            # Clean up
            if request_id in active_requests:
                del active_requests[request_id]
            
            end_time = datetime.now()
            response_data["processing_time"] = (end_time - start_time).total_seconds()
            
            return response_data
            
        except asyncio.TimeoutError:
            # Clean up on timeout
            if request_id in active_requests:
                del active_requests[request_id]
            raise TimeoutError(f"Chat request timed out after {REQUEST_TIMEOUT} seconds")
        except asyncio.CancelledError:
            raise
        except Exception as e:
            # Clean up on error
            if request_id in active_requests:
                del active_requests[request_id]
            raise
    
    async def _process_chat_request(self, user_query: str, request_id: str, language: str = "en") -> Dict[str, any]:
        """Process a single chat request"""
        # Search for relevant context
        context = await self.search_relevant_context(user_query, k=5)
        
        # Generate response
        response = await self.generate_response(user_query, context, request_id, language)
        
        return {
            "response": response,
            "query": user_query,
            "context_used": len(context),
            "request_id": request_id
        }


# Global chatbot instance
chatbot_instance: Optional[ChatbotRAG] = None


def get_chatbot() -> ChatbotRAG:
    """Get or initialize chatbot instance"""
    global chatbot_instance
    
    if chatbot_instance is None:
        chatbot_instance = ChatbotRAG()
        chatbot_instance.initialize()
    
    return chatbot_instance


def initialize_chatbot():
    """Initialize chatbot on startup"""
    try:
        chatbot = get_chatbot()
        return chatbot
    except Exception as e:
        print(f"⚠️ Warning: Could not initialize chatbot: {e}")
        return None
