import pytest
from fastapi.testclient import TestClient
import os

# Clean test db
if os.path.exists("./test_stockflow.db"):
    os.remove("./test_stockflow.db")

os.environ["DATABASE_URL"] = "sqlite:///./test_stockflow.db"

from main import app
from database import engine, Base

Base.metadata.create_all(bind=engine)
client = TestClient(app)

def test_full_api_workflow():
    # 1. Signup Org A
    res = client.post("/api/auth/signup", json={
        "organization_name": "Acme Corp",
        "email": "user@acme.com",
        "password": "password123"
    })
    assert res.status_code == 201, res.text
    data = res.json()
    assert "access_token" in data
    assert data["organization"]["name"] == "Acme Corp"
    token_a = data["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Login Org A
    res = client.post("/api/auth/login", json={
        "email": "user@acme.com",
        "password": "password123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

    # 3. Create Product 1 (Normal stock)
    res = client.post("/api/products", headers=headers_a, json={
        "name": "Widget A",
        "sku": "WID-A-001",
        "description": "Standard Widget",
        "quantity": 20,
        "cost_price": 5.0,
        "selling_price": 12.0,
        "low_stock_threshold": 10
    })
    assert res.status_code == 201
    prod1 = res.json()
    assert prod1["is_low_stock"] is False
    prod1_id = prod1["id"]

    # 4. Create Product 2 (Low stock - using custom threshold)
    res = client.post("/api/products", headers=headers_a, json={
        "name": "Widget B",
        "sku": "WID-B-002",
        "quantity": 3,
        "low_stock_threshold": 5
    })
    assert res.status_code == 201
    prod2 = res.json()
    assert prod2["is_low_stock"] is True

    # 5. Create Product 3 (Low stock - using org default 5)
    res = client.post("/api/products", headers=headers_a, json={
        "name": "Widget C",
        "sku": "WID-C-003",
        "quantity": 4
    })
    assert res.status_code == 201
    prod3 = res.json()
    assert prod3["is_low_stock"] is True
    assert prod3["effective_threshold"] == 5

    # 6. Check Dashboard
    res = client.get("/api/dashboard", headers=headers_a)
    assert res.status_code == 200
    dash = res.json()
    assert dash["total_products"] == 3
    assert dash["total_stock_quantity"] == 27
    assert dash["low_stock_count"] == 2

    # 7. Search products
    res = client.get("/api/products?search=widget", headers=headers_a)
    assert res.status_code == 200
    assert len(res.json()) == 3

    res = client.get("/api/products?search=WID-A", headers=headers_a)
    assert res.status_code == 200
    assert len(res.json()) == 1

    # 8. Edit Product 1 (Update quantity to low stock)
    res = client.put(f"/api/products/{prod1_id}", headers=headers_a, json={
        "quantity": 2
    })
    assert res.status_code == 200
    assert res.json()["quantity"] == 2
    assert res.json()["is_low_stock"] is True

    # 9. Settings: Change default threshold
    res = client.put("/api/settings", headers=headers_a, json={
        "default_low_stock_threshold": 2
    })
    assert res.status_code == 200
    assert res.json()["default_low_stock_threshold"] == 2

    # 10. Multi-tenancy check: Create Org B, ensure it cannot see Org A products
    res_b = client.post("/api/auth/signup", json={
        "organization_name": "Beta LLC",
        "email": "user@beta.com",
        "password": "password123"
    })
    headers_b = {"Authorization": f"Bearer {res_b.json()['access_token']}"}
    res_b_prods = client.get("/api/products", headers=headers_b)
    assert len(res_b_prods.json()) == 0

    # Org B trying to access Org A product
    res_cross = client.get(f"/api/products/{prod1_id}", headers=headers_b)
    assert res_cross.status_code == 404

    # 11. Delete Product
    res_del = client.delete(f"/api/products/{prod1_id}", headers=headers_a)
    assert res_del.status_code == 204

    # Verify deleted
    res_get = client.get(f"/api/products/{prod1_id}", headers=headers_a)
    assert res_get.status_code == 404

    print("ALL API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_api_workflow()
