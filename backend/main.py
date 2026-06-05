from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from db import db

app = FastAPI(
    title="Bubble Tea Ranker API",
    description="API for ranking bubble tea shops and managing user reviews.",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For MVP. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas
class ShopCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    country: str = Field(..., min_length=1, max_length=50)

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    favorite_drinks: Optional[str] = Field(None, max_length=100)
    review_text: Optional[str] = Field(None, max_length=1000)
    author: Optional[str] = Field("Anonymous", max_length=50)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Bubble Tea Ranker API!"}

@app.get("/api/shops")
def get_shops():
    try:
        return db.get_shops()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/shops/{shop_id}")
def get_shop(shop_id: str):
    shop = db.get_shop(shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    reviews = db.get_reviews(shop_id)
    return {
        "shop": shop,
        "reviews": reviews
    }

@app.post("/api/shops")
def create_shop(shop: ShopCreate):
    try:
        return db.create_shop(name=shop.name, country=shop.country)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/shops/{shop_id}/reviews")
def create_review(shop_id: str, review: ReviewCreate):
    shop = db.get_shop(shop_id)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    try:
        return db.create_review(
            shop_id=shop_id,
            rating=review.rating,
            favorite_drinks=review.favorite_drinks,
            review_text=review.review_text,
            author=review.author or "Anonymous"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from mangum import Mangum
handler = Mangum(app)

