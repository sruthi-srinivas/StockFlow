# StockFlow – Simple Inventory Management MVP

A clean, modern, and intuitive SaaS Inventory Management System built with **React + Vite**, **Tailwind CSS**, and **FastAPI + SQLAlchemy**.

---

## 🚀 Features

- **Authentication & Multi-Tenancy**:
  - User signup with Email, Password, and Organization Name.
  - Secure bcrypt password hashing and JWT token authentication.
  - Strict organization-level data isolation: users can only view and manage products belonging to their organization.
- **Product Management**:
  - Add, View, Edit, and Delete products with confirmation dialogs.
  - Product fields: Name, SKU, Description, Quantity, Cost Price, Selling Price, Low-stock Threshold.
  - Real-time search by product Name or SKU.
- **Dashboard**:
  - Overview cards: Total Products, Total Stock Quantity, and Low-Stock Alert Count.
  - Quick-action replenishing table listing all items at or below their low-stock threshold.
- **Settings**:
  - Configurable organization-wide default low-stock threshold (default: 5 units).
  - Product-level threshold overrides or automatic fallback to the organization default.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Backend**: Python 3, FastAPI, Uvicorn, SQLAlchemy, Pydantic, PyJWT, Passlib (bcrypt)
- **Database**: PostgreSQL / SQLite (via SQLAlchemy ORM)

---

## ⚡ Getting Started

### 1. Backend Setup

```bash
cd backend

# (Optional) Setup virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate  # On Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn main:app --reload --port 8000
```
Backend API docs will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run backend integration and multi-tenancy tests:
```bash
cd backend
python test_api.py
```
