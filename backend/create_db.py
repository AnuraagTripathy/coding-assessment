### ONE TIME SCRIPT TO CREATE THE DATABASE

import sqlite3
import json

# Properly structure the main block
if __name__ == "__main__":
    # Connect to the database (creates it if it doesn't exist)
    conn = sqlite3.connect('auth.db')
    cursor = conn.cursor()

    # Create products table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        dataCategory TEXT NOT NULL,
        recordCount INTEGER NOT NULL,
        fields TEXT NOT NULL,
        description TEXT NOT NULL
    )
    ''')

    # Check if users table already exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if cursor.fetchone() is None:
        # Create users table if it doesn't exist (similar to the FastAPI server)
        cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT,
            full_name TEXT,
            hashed_password TEXT NOT NULL,
            disabled BOOLEAN DEFAULT 0,
            products TEXT
        )
        ''')
    else:
        # Check if products column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        
        # Add products column if it doesn't exist
        if 'products' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN products TEXT")

    # Create user_products table for many-to-many relationship
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS user_products (
        user_id INTEGER,
        product_id INTEGER,
        PRIMARY KEY (user_id, product_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
    )
    ''')
    print("it runs")
    # Mock product data
    mock_products = [
        {
            "id": 1,
            "name": "Company Database",
            "dataCategory": "Firmographic",
            "recordCount": 5250,
            "fields": ["Company name", "Company address", "Website", "Industry", "Employee count", "Revenue"],
            "description": "Comprehensive database of company information including basic details and key metrics."
        },
        {
            "id": 2,
            "name": "Contact Information",
            "dataCategory": "Contact",
            "recordCount": 12500,
            "fields": ["Full name", "Email", "Phone number", "Job title", "Department"],
            "description": "Database of business contacts with complete professional information."
        },
        {
            "id": 3,
            "name": "Financial Metrics",
            "dataCategory": "Financial",
            "recordCount": 3800,
            "fields": ["Annual revenue", "Profit margin", "Growth rate", "Funding rounds", "Investors"],
            "description": "Detailed financial information for public and private companies."
        },
        {
            "id": 4,
            "name": "Technology Stack",
            "dataCategory": "Technographic",
            "recordCount": 4200,
            "fields": ["Technologies used", "Software vendors", "IT spending", "Cloud services"],
            "description": "Information about the technologies and software companies are using."
        },
        {
            "id": 5,
            "name": "Industry Trends",
            "dataCategory": "Market Intelligence",
            "recordCount": 1800,
            "fields": ["Market size", "Growth projections", "Competitive landscape", "Market share"],
            "description": "Market research data organized by industry vertical."
        },
        {
            "id": 6,
            "name": "Social Media Presence",
            "dataCategory": "Digital",
            "recordCount": 7500,
            "fields": ["Social profiles", "Follower count", "Engagement metrics", "Content strategy"],
            "description": "Analysis of company social media presence and digital footprint."
        }
    ]

    # Mock user
    mock_user = {
        "id": 1,
        "email": "demo@example.com",
        "name": "Demo User",
        "username": "demo",  # Adding username for our auth system
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # password: 'password'
        "products": [1, 2, 3]  # Product IDs this user has access to
    }

    # Insert products
    for product in mock_products:
        cursor.execute(
            "INSERT OR REPLACE INTO products (id, name, dataCategory, recordCount, fields, description) VALUES (?, ?, ?, ?, ?, ?)",
            (
                product["id"],
                product["name"],
                product["dataCategory"],
                product["recordCount"],
                json.dumps(product["fields"]),
                product["description"]
            )
        )

    # Insert mock user (if not exists)
    cursor.execute("SELECT id FROM users WHERE username = ?", (mock_user["username"],))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (id, username, email, full_name, hashed_password, products) VALUES (?, ?, ?, ?, ?, ?)",
            (
                mock_user["id"],
                mock_user["username"],
                mock_user["email"],
                mock_user["name"],
                mock_user["hashed_password"],
                json.dumps(mock_user["products"])
            )
        )

    # Add user-product relationships
    for product_id in mock_user["products"]:
        cursor.execute(
            "INSERT OR IGNORE INTO user_products (user_id, product_id) VALUES (?, ?)",
            (mock_user["id"], product_id)
        )
    # Verify data was inserted correctly
    print("\nVerifying data insertion:")
    
    # Check products
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    print(f"\nProducts in database ({len(products)} total):")
    for product in products:
        print(f"- {product[1]} (ID: {product[0]})")
    
    # Check users
    cursor.execute("SELECT username, email, full_name FROM users")
    users = cursor.fetchall()
    print(f"\nUsers in database ({len(users)} total):")
    for user in users:
        print(f"- {user[0]} ({user[1]}, {user[2]})")
    
    # Check user-product relationships
    cursor.execute("""
        SELECT users.username, products.name 
        FROM users
        JOIN user_products ON users.id = user_products.user_id
        JOIN products ON products.id = user_products.product_id
    """)
    relationships = cursor.fetchall()
    print(f"\nUser-Product relationships ({len(relationships)} total):")
    for rel in relationships:
        print(f"- {rel[0]} has access to: {rel[1]}")

    # Commit changes and close connection
    conn.commit()
    conn.close()

    print("Database setup complete!")
    print("- Products table created with 6 mock products")
    print("- Users table updated or created with demo user")
    print("- User-Products relationship table created")
    print("- Demo user credentials: username='demo', password='password'")