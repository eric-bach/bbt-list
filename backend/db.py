import os
import uuid
import time
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

# Configuration
SHOPS_TABLE = os.environ.get("SHOPS_TABLE", "bbt-list-shops-dev")
REVIEWS_TABLE = os.environ.get("REVIEWS_TABLE", "bbt-list-reviews-dev")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

class DynamoDB:
    def __init__(self):
        self.dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
        self.shops_table = self.dynamodb.Table(SHOPS_TABLE)
        self.reviews_table = self.dynamodb.Table(REVIEWS_TABLE)

    def get_shops(self):
        try:
            response = self.shops_table.scan()
            items = response.get("Items", [])
            # Sort by average_rating DESC, name ASC
            for item in items:
                item["average_rating"] = float(item.get("average_rating", 0.0))
                item["review_count"] = int(item.get("review_count", 0))
            return sorted(items, key=lambda x: (-x["average_rating"], x.get("name", "")))
        except ClientError as e:
            print(f"DynamoDB Error: {e}")
            raise

    def get_shop(self, shop_id):
        try:
            response = self.shops_table.get_item(Key={"id": shop_id})
            item = response.get("Item")
            if item:
                item["average_rating"] = float(item.get("average_rating", 0.0))
                item["review_count"] = int(item.get("review_count", 0))
            return item
        except ClientError:
            return None

    def get_reviews(self, shop_id):
        try:
            response = self.reviews_table.query(
                KeyConditionExpression=boto3.dynamodb.conditions.Key("shopId").eq(shop_id)
            )
            items = response.get("Items", [])
            for item in items:
                item["rating"] = int(item.get("rating", 0))
                item["created_at"] = float(item.get("created_at", 0.0))
            # Sort by created_at DESC
            return sorted(items, key=lambda x: -x["created_at"])
        except ClientError:
            return []

    def create_shop(self, name, country):
        shop_id = str(uuid.uuid4())
        item = {
            "id": shop_id,
            "name": name,
            "country": country,
            "average_rating": 0,
            "review_count": 0,
            "favorite_drink": None
        }
        self.shops_table.put_item(Item=item)
        return item

    def create_review(self, shop_id, rating, favorite_drinks, review_text, author):
        review_id = str(uuid.uuid4())
        now = time.time()
        
        # Insert review
        review_item = {
            "id": review_id,
            "shopId": shop_id,
            "rating": rating,
            "favorite_drinks": favorite_drinks,
            "review_text": review_text,
            "author": author,
            "created_at": now
        }
        self.reviews_table.put_item(Item=review_item)

        # Recalculate average rating & update shop
        reviews = self.get_reviews(shop_id)
        review_count = len(reviews)
        avg_rating = sum(r["rating"] for r in reviews) / review_count if review_count > 0 else 0.0
        
        fav_drink = favorite_drinks if favorite_drinks else None
        if not fav_drink:
            for r in reviews: # reviews are sorted by created_at DESC
                if r.get("favorite_drinks"):
                    fav_drink = r["favorite_drinks"]
                    break

        self.shops_table.update_item(
            Key={"id": shop_id},
            UpdateExpression="SET average_rating = :r, review_count = :c, favorite_drink = :f",
            ExpressionAttributeValues={
                ":r": round(avg_rating, 2),
                ":c": review_count,
                ":f": fav_drink
            }
        )
        return review_item

db = DynamoDB()
