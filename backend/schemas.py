from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# User & Auth Schemas
class SignupRequest(BaseModel):
    organization_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    organization_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class OrganizationResponse(BaseModel):
    id: int
    name: str
    default_low_stock_threshold: int
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    organization: OrganizationResponse

# Settings Schema
class SettingsUpdate(BaseModel):
    default_low_stock_threshold: int = Field(..., ge=0)

# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    quantity: int = Field(..., ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    selling_price: Optional[float] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    selling_price: Optional[float] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: int
    organization_id: int
    is_low_stock: bool
    effective_threshold: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Dashboard Schema
class DashboardStats(BaseModel):
    total_products: int
    total_stock_quantity: int
    low_stock_count: int
    low_stock_products: List[ProductResponse]
