import uvicorn
import sys
import os

# Ensure UTF-8 output on Windows terminal
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("[HOTEL GRAND] NEXT-GEN AI MANAGEMENT PLATFORM")
    print("=" * 60)
    print(">> Starting FastAPI Neural Server...")
    print(">> Web Application: http://127.0.0.1:8000")
    print(">> Interactive API Docs: http://127.0.0.1:8000/docs")
    print("=" * 60 + "\n")
    
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
