"""
Script to list available Gemini models for the API key
"""
import google.generativeai as genai
import os

# Load API key
API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBcuhuoRJCVURnmoj_0_qu98MS-znCwPD4")
genai.configure(api_key=API_KEY)

print("🔍 Listing available Gemini models...\n")

try:
    models = genai.list_models()
    print("Available models:\n")
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            print(f"✅ {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Description: {model.description}")
            print(f"   Supported Methods: {model.supported_generation_methods}")
            print()
except Exception as e:
    print(f"❌ Error listing models: {e}")
    import traceback
    traceback.print_exc()
