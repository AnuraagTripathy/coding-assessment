from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import sqlite3
import uvicorn
import os

# Configuration
SECRET_KEY = "your-secret-key"  # Change this to a secure random string in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATABASE_NAME = "auth.db"

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: str

class Product(BaseModel):
    id: int
    name: str
    dataCategory: str
    recordCount: int
    fields: List[str]
    description: str
    
class ProductAssignment(BaseModel):
    product_id: int

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(title="FastAPI JWT Auth", description="A simple FastAPI server with JWT authentication using SQLite")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Database setup
def init_db():
    # Create database if it doesn't exist
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        hashed_password TEXT,
        disabled BOOLEAN
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(username: str):
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user:
        return UserInDB(**dict(user))
    return None

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Routes
@app.post("/register", response_model=User)
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = get_user(user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Insert user into database
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO users (username, email, full_name, hashed_password, disabled) VALUES (?, ?, ?, ?, ?)",
        (user.username, user.email, user.full_name, hashed_password, False)
    )
    
    conn.commit()
    conn.close()
    
    return {
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "disabled": False
    }

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/protected-resource")
async def get_protected_resource(current_user: User = Depends(get_current_active_user)):
    return {
        "message": f"Hello, {current_user.username}! This is a protected resource.",
        "data": "Some valuable protected data"
    }

@app.get("/users", response_model=List[User])
async def get_all_users(current_user: User = Depends(get_current_active_user)):
    """Get all users (only for authenticated users)"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT username, email, full_name, disabled FROM users")
    users = cursor.fetchall()
    
    conn.close()
    
    return [dict(user) for user in users]

@app.get("/products", response_model=List[Product])
async def get_all_products(current_user: User = Depends(get_current_active_user)):
    """Get all products (requires authentication)"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, dataCategory, recordCount, fields, description FROM products")
    products_raw = cursor.fetchall()
    
    conn.close()
    
    # Convert the products and parse the JSON fields array
    products = []
    for product in products_raw:
        product_dict = dict(product)
        import json
        product_dict["fields"] = json.loads(product_dict["fields"])
        products.append(product_dict)
    
    return products

@app.get("/products/{product_id}", response_model=Product)
async def get_product_by_id(product_id: int, current_user: User = Depends(get_current_active_user)):
    """Get a specific product by ID (requires authentication)"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, name, dataCategory, recordCount, fields, description FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()
    
    conn.close()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Convert the product and parse the JSON fields array
    product_dict = dict(product)
    import json
    product_dict["fields"] = json.loads(product_dict["fields"])
    
    return product_dict

@app.post("/assign-product")
async def assign_product(
    assignment: ProductAssignment, 
    current_user: User = Depends(get_current_active_user)
):
    """Assign a product to the current user"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get user ID from username
    cursor.execute("SELECT id FROM users WHERE username = ?", (current_user.username,))
    user_id_result = cursor.fetchone()
    
    if not user_id_result:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_id = user_id_result["id"]
    
    # Check if product exists
    cursor.execute("SELECT id FROM products WHERE id = ?", (assignment.product_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Create the assignment in the junction table
    try:
        cursor.execute(
            "INSERT OR IGNORE INTO user_products (user_id, product_id) VALUES (?, ?)",
            (user_id, assignment.product_id)
        )
        conn.commit()
        
        # Check if the row was actually inserted or was ignored
        if cursor.rowcount == 0:
            conn.close()
            return {"message": "This product is already assigned to the user"}
    except sqlite3.IntegrityError:
        conn.close()
        return {"message": "This product is already assigned to the user"}
    
    conn.close()
    return {"message": f"Product {assignment.product_id} assigned to user successfully"}

@app.delete("/unassign-product/{product_id}")
async def unassign_product(
    product_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Remove a product assignment from the current user"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get user ID from username
    cursor.execute("SELECT id FROM users WHERE username = ?", (current_user.username,))
    user_id_result = cursor.fetchone()
    
    if not user_id_result:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_id = user_id_result["id"]
    
    # Delete the assignment from junction table
    cursor.execute(
        "DELETE FROM user_products WHERE user_id = ? AND product_id = ?",
        (user_id, product_id)
    )
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not assigned to user or doesn't exist"
        )
    
    conn.commit()
    conn.close()
    
    return {"message": f"Product {product_id} unassigned from user successfully"}

@app.get("/my-products", response_model=List[Product])
async def get_user_products(current_user: User = Depends(get_current_active_user)):
    """Get products assigned to the current user"""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get user ID from username
    cursor.execute("SELECT id FROM users WHERE username = ?", (current_user.username,))
    user_id_result = cursor.fetchone()
    
    if not user_id_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_id = user_id_result["id"]
    
    # Get products assigned to this user through the junction table
    cursor.execute("""
        SELECT p.id, p.name, p.dataCategory, p.recordCount, p.fields, p.description 
        FROM products p
        JOIN user_products up ON p.id = up.product_id
        WHERE up.user_id = ?
    """, (user_id,))
    
    products_raw = cursor.fetchall()
    conn.close()
    
    # Convert the products and parse the JSON fields array
    products = []
    for product in products_raw:
        product_dict = dict(product)
        import json
        product_dict["fields"] = json.loads(product_dict["fields"])
        products.append(product_dict)
    
    return products

# Main entry point
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)