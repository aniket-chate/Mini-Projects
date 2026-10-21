from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, List, Dict
from backend.ai_engine.concierge import chat_with_concierge
from backend.ai_engine.id_scanner import parse_id_document
from backend.ai_engine.sentiment import analyze_sentiment
from backend.database import get_db_connection

router = APIRouter(prefix="/api/ai", tags=["AI Services"])

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None
    role: Optional[str] = "guest"
    username: Optional[str] = None

class FeedbackRequest(BaseModel):
    guest_name: str
    rating: int
    comment: str

class TextScanRequest(BaseModel):
    document_text: str

@router.post("/chat")
def concierge_chat(req: ChatRequest):
    """Interact with NOVA, the AI Virtual Concierge."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    response = chat_with_concierge(
        message=req.message, 
        history=req.history, 
        role=req.role or "guest", 
        username=req.username
    )
    return {"success": True, "data": response}

@router.post("/scan-id")
async def scan_id_card(
    document_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Smart AI Check-in: parses identity document via text or file upload."""
    image_bytes = None
    if file:
        image_bytes = await file.read()
    
    extracted = parse_id_document(text_content=document_text or "", image_bytes=image_bytes)
    return {"success": True, "extracted": extracted}

@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    """Submit guest review with automated AI sentiment analysis."""
    sentiment_data = analyze_sentiment(req.comment, req.rating)

    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO feedback (guest_name, rating, comment, sentiment, sentiment_score, urgent_alert)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                req.guest_name.strip().title(),
                req.rating,
                req.comment.strip(),
                sentiment_data['sentiment'],
                sentiment_data['sentiment_score'],
                sentiment_data['urgent_alert']
            ))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    return {
        "success": True,
        "message": "Thank you for your feedback!",
        "analysis": sentiment_data
    }

@router.get("/feedback")
def list_feedback(limit: int = 15):
    """Retrieve recent guest feedback and sentiment scores."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, guest_name, rating, comment, sentiment, sentiment_score, urgent_alert, created_at
            FROM feedback
            ORDER BY id DESC LIMIT %s
        """, (limit,))
        return {"success": True, "feedback": cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()
