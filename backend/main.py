from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from database import engine, Base, get_db
import models
import schemas
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="StockFlow API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_product_response(product: models.Product, default_threshold: int) -> dict:
    threshold = product.low_stock_threshold if product.low_stock_threshold is not None else default_threshold
    is_low = product.quantity <= threshold
    return {
        "id": product.id,
        "organization_id": product.organization_id,
        "name": product.name,
        "sku": product.sku,
        "description": product.description,
        "quantity": product.quantity,
        "cost_price": product.cost_price,
        "selling_price": product.selling_price,
        "low_stock_threshold": product.low_stock_threshold,
        "effective_threshold": threshold,
        "is_low_stock": is_low,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }

# ----------------- Authentication Endpoints -----------------

@app.post("/api/auth/signup", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(data: schemas.SignupRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Create Organization
    org = models.Organization(name=data.organization_name.strip(), default_low_stock_threshold=5)
    db.add(org)
    db.commit()
    db.refresh(org)

    # Create User associated with Organization
    hashed_password = get_password_hash(data.password)
    user = models.User(
        email=data.email.lower(),
        password_hash=hashed_password,
        organization_id=org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "org_id": org.id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
        "organization": org
    }

@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    org = db.query(models.Organization).filter(models.Organization.id == user.organization_id).first()
    token = create_access_token({"sub": str(user.id), "org_id": org.id})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
        "organization": org
    }

@app.get("/api/auth/me")
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    return {
        "user": schemas.UserResponse.from_orm(current_user),
        "organization": schemas.OrganizationResponse.from_orm(org)
    }

# ----------------- Settings Endpoints -----------------

@app.get("/api/settings", response_model=schemas.OrganizationResponse)
def get_settings(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    return org

@app.put("/api/settings", response_model=schemas.OrganizationResponse)
def update_settings(
    settings_data: schemas.SettingsUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    org.default_low_stock_threshold = settings_data.default_low_stock_threshold
    db.commit()
    db.refresh(org)
    return org

# ----------------- Dashboard Endpoints -----------------

@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard_stats(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    default_thresh = org.default_low_stock_threshold if org else 5

    products = db.query(models.Product).filter(models.Product.organization_id == current_user.organization_id).all()

    total_products = len(products)
    total_stock_quantity = sum(p.quantity for p in products)

    formatted_products = [format_product_response(p, default_thresh) for p in products]
    low_stock_products = [p for p in formatted_products if p["is_low_stock"]]

    return {
        "total_products": total_products,
        "total_stock_quantity": total_stock_quantity,
        "low_stock_count": len(low_stock_products),
        "low_stock_products": low_stock_products
    }

# ----------------- Product CRUD Endpoints -----------------

@app.get("/api/products", response_model=List[schemas.ProductResponse])
def get_products(
    search: Optional[str] = Query(None, description="Search by product name or SKU"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    default_thresh = org.default_low_stock_threshold if org else 5

    query = db.query(models.Product).filter(models.Product.organization_id == current_user.organization_id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (models.Product.name.ilike(search_pattern)) | (models.Product.sku.ilike(search_pattern))
        )

    products = query.order_by(models.Product.created_at.desc()).all()
    return [format_product_response(p, default_thresh) for p in products]

@app.post("/api/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: schemas.ProductCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    default_thresh = org.default_low_stock_threshold if org else 5

    # Check for duplicate SKU within organization
    existing_sku = db.query(models.Product).filter(
        models.Product.organization_id == current_user.organization_id,
        models.Product.sku == data.sku.strip()
    ).first()

    if existing_sku:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A product with SKU '{data.sku}' already exists in your organization."
        )

    product = models.Product(
        organization_id=current_user.organization_id,
        name=data.name.strip(),
        sku=data.sku.strip(),
        description=data.description.strip() if data.description else None,
        quantity=data.quantity,
        cost_price=data.cost_price,
        selling_price=data.selling_price,
        low_stock_threshold=data.low_stock_threshold
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return format_product_response(product, default_thresh)

@app.get("/api/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    default_thresh = org.default_low_stock_threshold if org else 5

    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.organization_id == current_user.organization_id
    ).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    return format_product_response(product, default_thresh)

@app.put("/api/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    data: schemas.ProductUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org = db.query(models.Organization).filter(models.Organization.id == current_user.organization_id).first()
    default_thresh = org.default_low_stock_threshold if org else 5

    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.organization_id == current_user.organization_id
    ).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    update_dict = data.dict(exclude_unset=True)

    if "sku" in update_dict and update_dict["sku"] != product.sku:
        existing_sku = db.query(models.Product).filter(
            models.Product.organization_id == current_user.organization_id,
            models.Product.sku == update_dict["sku"].strip(),
            models.Product.id != product_id
        ).first()
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another product with SKU '{update_dict['sku']}' already exists."
            )

    for field, val in update_dict.items():
        if isinstance(val, str):
            val = val.strip()
        setattr(product, field, val)

    db.commit()
    db.refresh(product)
    return format_product_response(product, default_thresh)

@app.delete("/api/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.organization_id == current_user.organization_id
    ).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    db.delete(product)
    db.commit()
    return None
