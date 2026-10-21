import os
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add project root directory to sys.path so 'backend' can be imported when run directly
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response

from backend.database import init_db
from backend.routers import auth, rooms, bookings, payments, reports, ai

app = FastAPI(
    title="Hotel Grand - AI Futuristic Platform",
    description="Next-generation AI-powered Hotel Management System",
    version="2.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Development No-Cache Middleware for Static Assets & HTML
@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static") or request.url.path == "/" or request.url.path.endswith(".js") or request.url.path.endswith(".css"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Include Routers
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(reports.router)
app.include_router(ai.router)

# Health Check
@app.get("/api/health")
def health_check():
    return {"status": "online", "system": "Hotel Grand Quantum AI", "version": "2.0.0"}

# Static Frontend Serving
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def serve_frontend_root():
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {"message": "Hotel AI Platform API online. Frontend index not found."}

    @app.get("/favicon.ico")
    def serve_favicon():
        fav = FRONTEND_DIR / "assets" / "favicon.svg"
        if fav.exists():
            return FileResponse(str(fav), media_type="image/svg+xml")
        return Response(status_code=204)

@app.on_event("startup")
def on_startup():
    print("🚀 Initializing Hotel AI Platform...")
    init_db()
    print("✅ System Ready at http://127.0.0.1:8000")


if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 60)
    print("[HOTEL GRAND] NEXT-GEN AI MANAGEMENT PLATFORM")
    print("=" * 60)
    print(">> Starting FastAPI Neural Server...")
    print(">> Web Application: http://127.0.0.1:8000")
    print(">> Interactive API Docs: http://127.0.0.1:8000/docs")
    print("=" * 60 + "\n")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
