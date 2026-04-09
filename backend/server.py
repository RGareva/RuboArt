from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, Request, HTTPException, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import bcrypt
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
CATEGORIES = ["Electronics", "Clothing", "Home & Kitchen", "Books", "Toys & Games", "Sports", "Beauty", "Accessories", "Stationery", "Other"]

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ===== AUTH HELPERS =====
def get_jwt_secret():
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ===== PYDANTIC MODELS =====
class RegisterInput(BaseModel):
    name: str
    email: str
    password: str


class LoginInput(BaseModel):
    email: str
    password: str


class ProductInput(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str = ""
    stock: int = 1


class CartItemInput(BaseModel):
    product_id: str
    quantity: int = 1


class CartUpdateInput(BaseModel):
    product_id: str
    quantity: int


class DeliveryAddress(BaseModel):
    name: str
    street: str
    city: str
    state: str
    zip_code: str
    phone: str


class OrderInput(BaseModel):
    delivery_address: DeliveryAddress


# ===== AUTH ROUTES =====
@api_router.post("/auth/register")
async def register(input_data: RegisterInput, response: Response):
    email = input_data.email.lower().strip()
    if len(input_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(input_data.password)
    user_doc = {
        "name": input_data.name.strip(),
        "email": email,
        "password_hash": hashed,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {"_id": user_id, "name": user_doc["name"], "email": email, "role": "user"}


@api_router.post("/auth/login")
async def login(input_data: LoginInput, request: Request, response: Response):
    email = input_data.email.lower().strip()
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"{client_ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_until = attempt.get("lockout_until")
        if lockout_until and datetime.now(timezone.utc) < datetime.fromisoformat(lockout_until):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(input_data.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"lockout_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_many({"identifier": identifier})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    return {"_id": user_id, "name": user["name"], "email": email, "role": user.get("role", "user")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user


@api_router.post("/auth/refresh")
async def refresh_token_endpoint(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ===== PRODUCT ROUTES =====
@api_router.get("/products")
async def list_products(search: str = "", category: str = "", page: int = 1, limit: int = 12):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if category and category != "All":
        query["category"] = category
    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@api_router.post("/products")
async def create_product(input_data: ProductInput, request: Request):
    user = await get_current_user(request)
    product = {
        "id": str(uuid.uuid4()),
        "name": input_data.name.strip(),
        "description": input_data.description.strip(),
        "price": round(input_data.price, 2),
        "category": input_data.category,
        "image_url": input_data.image_url or "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        "stock": input_data.stock,
        "seller_id": user["_id"],
        "seller_name": user["name"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product)
    product.pop("_id", None)
    return product


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, input_data: ProductInput, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product["seller_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    update_data = {
        "name": input_data.name.strip(),
        "description": input_data.description.strip(),
        "price": round(input_data.price, 2),
        "category": input_data.category,
        "image_url": input_data.image_url or product.get("image_url", ""),
        "stock": input_data.stock,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product["seller_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted"}


@api_router.get("/my-products")
async def get_my_products(request: Request):
    user = await get_current_user(request)
    products = await db.products.find({"seller_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return products


@api_router.get("/categories")
async def get_categories():
    return CATEGORIES


# ===== CART ROUTES =====
@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not cart:
        return {"user_id": user["_id"], "items": []}
    return cart


@api_router.post("/cart/add")
async def add_to_cart(input_data: CartItemInput, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"id": input_data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product["stock"] < input_data.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
    cart = await db.carts.find_one({"user_id": user["_id"]})
    cart_item = {
        "product_id": product["id"],
        "name": product["name"],
        "price": product["price"],
        "quantity": input_data.quantity,
        "image_url": product["image_url"]
    }
    if cart:
        existing_idx = next((i for i, item in enumerate(cart.get("items", [])) if item["product_id"] == input_data.product_id), None)
        if existing_idx is not None:
            cart["items"][existing_idx]["quantity"] += input_data.quantity
            await db.carts.update_one({"user_id": user["_id"]}, {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc).isoformat()}})
        else:
            await db.carts.update_one({"user_id": user["_id"]}, {"$push": {"items": cart_item}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}})
    else:
        await db.carts.insert_one({"user_id": user["_id"], "items": [cart_item], "updated_at": datetime.now(timezone.utc).isoformat()})
    updated = await db.carts.find_one({"user_id": user["_id"]}, {"_id": 0})
    return updated


@api_router.put("/cart/update")
async def update_cart_item(input_data: CartUpdateInput, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    items = cart.get("items", [])
    found = False
    for i, item in enumerate(items):
        if item["product_id"] == input_data.product_id:
            if input_data.quantity <= 0:
                items.pop(i)
            else:
                item["quantity"] = input_data.quantity
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Item not in cart")
    await db.carts.update_one({"user_id": user["_id"]}, {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}})
    updated = await db.carts.find_one({"user_id": user["_id"]}, {"_id": 0})
    return updated


@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, request: Request):
    user = await get_current_user(request)
    await db.carts.update_one(
        {"user_id": user["_id"]},
        {"$pull": {"items": {"product_id": product_id}}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.carts.find_one({"user_id": user["_id"]}, {"_id": 0})
    return updated or {"user_id": user["_id"], "items": []}


# ===== SHIPPING =====
def calculate_shipping(subtotal: float):
    if subtotal >= 100:
        delivery_fee = 0
    elif subtotal >= 50:
        delivery_fee = 2.99
    else:
        delivery_fee = 4.99
    courier_tax = round(subtotal * 0.025, 2)
    return {"delivery_fee": delivery_fee, "courier_tax": courier_tax}


@api_router.get("/shipping/calculate")
async def calculate_shipping_cost(request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart or not cart.get("items"):
        return {"subtotal": 0, "delivery_fee": 0, "courier_tax": 0, "total": 0}
    subtotal = round(sum(item["price"] * item["quantity"] for item in cart["items"]), 2)
    shipping = calculate_shipping(subtotal)
    total = round(subtotal + shipping["delivery_fee"] + shipping["courier_tax"], 2)
    return {"subtotal": subtotal, **shipping, "total": total}


# ===== ORDERS =====
@api_router.post("/orders")
async def create_order(input_data: OrderInput, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    subtotal = round(sum(item["price"] * item["quantity"] for item in cart["items"]), 2)
    shipping = calculate_shipping(subtotal)
    total = round(subtotal + shipping["delivery_fee"] + shipping["courier_tax"], 2)
    order = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "user_name": user["name"],
        "user_email": user.get("email", ""),
        "items": cart["items"],
        "subtotal": subtotal,
        "delivery_fee": shipping["delivery_fee"],
        "courier_tax": shipping["courier_tax"],
        "total": total,
        "payment_method": "pay_on_delivery",
        "delivery_address": input_data.delivery_address.model_dump(),
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    await db.carts.delete_one({"user_id": user["_id"]})
    for item in cart["items"]:
        await db.products.update_one({"id": item["product_id"]}, {"$inc": {"stock": -item["quantity"]}})
    order.pop("_id", None)
    return order


@api_router.get("/orders")
async def list_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"id": order_id, "user_id": user["_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ===== ADMIN HELPERS =====
async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class OrderStatusUpdate(BaseModel):
    status: str


class UserRoleUpdate(BaseModel):
    role: str


# ===== ADMIN ROUTES =====
@api_router.get("/admin/stats")
async def admin_stats(request: Request):
    await require_admin(request)
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    orders = await db.orders.find({}, {"_id": 0, "total": 1}).to_list(10000)
    total_revenue = round(sum(o.get("total", 0) for o in orders), 2)
    pending_orders = await db.orders.count_documents({"status": "confirmed"})
    shipped_orders = await db.orders.count_documents({"status": "shipped"})
    delivered_orders = await db.orders.count_documents({"status": "delivered"})
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_users": total_users,
        "total_revenue": total_revenue,
        "pending_orders": pending_orders,
        "shipped_orders": shipped_orders,
        "delivered_orders": delivered_orders,
    }


@api_router.get("/admin/products")
async def admin_list_products(request: Request, search: str = "", category: str = "", page: int = 1, limit: int = 20):
    await require_admin(request)
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if category and category != "All":
        query["category"] = category
    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"products": products, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}


@api_router.get("/admin/orders")
async def admin_list_orders(request: Request, status: str = "", page: int = 1, limit: int = 20):
    await require_admin(request)
    query = {}
    if status and status != "all":
        query["status"] = status
    skip = (page - 1) * limit
    total = await db.orders.count_documents(query)
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"orders": orders, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}


@api_router.put("/admin/orders/{order_id}/status")
async def admin_update_order_status(order_id: str, input_data: OrderStatusUpdate, request: Request):
    await require_admin(request)
    valid_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
    if input_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": input_data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return order


@api_router.get("/admin/users")
async def admin_list_users(request: Request, search: str = "", page: int = 1, limit: int = 20):
    await require_admin(request)
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    skip = (page - 1) * limit
    total = await db.users.count_documents(query)
    users_cursor = db.users.find(query, {"password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit)
    users = []
    async for u in users_cursor:
        u["_id"] = str(u["_id"])
        users.append(u)
    return {"users": users, "total": total, "page": page, "pages": max(1, (total + limit - 1) // limit)}


@api_router.put("/admin/users/{user_id}/role")
async def admin_update_user_role(user_id: str, input_data: UserRoleUpdate, request: Request):
    admin = await require_admin(request)
    if user_id == admin["_id"]:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    valid_roles = ["user", "admin"]
    if input_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": input_data.role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User role updated to {input_data.role}"}


@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request):
    admin = await require_admin(request)
    if user_id == admin["_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    await db.carts.delete_many({"user_id": user_id})
    return {"message": "User deleted"}


# ===== STARTUP & SHUTDOWN =====
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.products.create_index("id", unique=True)
    await db.products.create_index("seller_id")
    await db.carts.create_index("user_id", unique=True)
    await db.orders.create_index("user_id")
    await db.orders.create_index("id", unique=True)
    await seed_admin()
    await seed_sample_products()
    logger.info("Application started successfully")


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")


async def seed_sample_products():
    count = await db.products.count_documents({})
    if count > 0:
        return
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        return
    seller_id = str(admin["_id"])
    now = datetime.now(timezone.utc).isoformat()
    samples = [
        {"id": str(uuid.uuid4()), "name": "Pastel Heart Dishes", "description": "Beautiful heart-shaped ceramic dishes in soft pastel colors. Perfect for storing jewelry, treats, or as decor.", "price": 24.99, "category": "Home & Kitchen", "image_url": "https://images.unsplash.com/photo-1771586814072-b4dd62ccc3e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxwYXN0ZWwlMjBjZXJhbWljJTIwbXVnfGVufDB8fHx8MTc3NTcyODEzMXww&ixlib=rb-4.1.0&q=85", "stock": 15, "seller_id": seller_id, "seller_name": "Admin", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Pastel Vases Set", "description": "Elegant set of pastel-colored ceramic vases. Perfect for dried flowers or as standalone decor pieces.", "price": 39.99, "category": "Home & Kitchen", "image_url": "https://images.unsplash.com/photo-1766084693399-3bb3569da848?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwzfHxwYXN0ZWwlMjBjZXJhbWljJTIwbXVnfGVufDB8fHx8MTc3NTcyODEzMXww&ixlib=rb-4.1.0&q=85", "stock": 10, "seller_id": seller_id, "seller_name": "Admin", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Lilac Notebook & Pen", "description": "Premium lilac-colored notebook with matching pen. Lined pages, perfect for journaling or note-taking.", "price": 18.50, "category": "Stationery", "image_url": "https://images.unsplash.com/photo-1762318897771-f68b31c0d11f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwzfHxwYXN0ZWwlMjBkZXNrJTIwYWNjZXNzb3JpZXN8ZW58MHx8fHwxNzc1NzI4MTMxfDA&ixlib=rb-4.1.0&q=85", "stock": 25, "seller_id": seller_id, "seller_name": "Admin", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Cute Plush Duo", "description": "Adorable pair of plush toys in pastel colors. Soft, huggable, and perfect as a gift for all ages.", "price": 29.99, "category": "Toys & Games", "image_url": "https://images.unsplash.com/photo-1770389356138-99567dd408f6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwzfHxjdXRlJTIwcGFzdGVsJTIwcGx1c2glMjB0b3l8ZW58MHx8fHwxNzc1NzI4MTMxfDA&ixlib=rb-4.1.0&q=85", "stock": 20, "seller_id": seller_id, "seller_name": "Admin", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Colorful Envelopes Pack", "description": "Set of 50 colorful pastel envelopes in assorted colors. Great for letters, invitations, or crafting.", "price": 12.99, "category": "Stationery", "image_url": "https://images.unsplash.com/photo-1762318898062-ee8d22f6966c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxwYXN0ZWwlMjBkZXNrJTIwYWNjZXNzb3JpZXN8ZW58MHx8fHwxNzc1NzI4MTMxfDA&ixlib=rb-4.1.0&q=85", "stock": 50, "seller_id": seller_id, "seller_name": "Admin", "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "name": "Pastel Stationery Kit", "description": "Complete stationery kit with pastel highlighters, pens, sticky notes, and washi tape. Perfect for students.", "price": 34.99, "category": "Stationery", "image_url": "https://images.pexels.com/photos/6193079/pexels-photo-6193079.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "stock": 30, "seller_id": seller_id, "seller_name": "Admin", "created_at": now, "updated_at": now},
    ]
    for product in samples:
        await db.products.insert_one(product)
    logger.info(f"Seeded {len(samples)} sample products")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
