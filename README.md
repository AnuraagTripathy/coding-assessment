# coding-assessment

clone the repo "https://github.com/AnuraagTripathy/coding-assessment.git"

# B2B Data Catalog

A full-stack application for managing and accessing B2B data products. This application consists of a FastAPI backend with SQLite database and a Next.js frontend.

## Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install Python dependencies:

```bash
pip install fastapi uvicorn pydantic passlib python-jose[cryptography] python-multipart sqlite3
```

3. Initialize the database (only needed once):

```bash
python create_db.py
```

4. Start the backend server:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

## Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install Node.js dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Frontend Environment Variables

The frontend is pre-configured to connect to the backend at `http://localhost:8000`. If you need to change this, edit the `API_URL` constant in:

- `frontend/app/dashboard/page.tsx`
- `frontend/app/login/page.tsx`
- `frontend/lib/api.ts`

## Using the Application

### Default User Credentials

```
Username: demodemo
Password: demodemo1234
```

### Features

- User authentication (login/register)
- Browse data products catalog
- Filter products by category and search terms
- View detailed product information
- Add/remove products to personal catalog
- Responsive design for mobile and desktop

## API Endpoints

### Authentication

- `POST /token`: Get access token (login)
- `POST /register`: Create new user

### Users

- `GET /users/me`: Get current user info
- `GET /users`: Get all users (admin)

### Products

- `GET /products`: Get all products
- `GET /products/{product_id}`: Get product by ID
- `POST /assign-product`: Add product to user's catalog
- `DELETE /unassign-product/{product_id}`: Remove product from user's catalog
- `GET /my-products`: Get products in user's catalog

## Development Notes

- The backend uses JWT for authentication
- The frontend uses local storage for session management
- The database is SQLite for simplicity, but can be replaced with another database for production