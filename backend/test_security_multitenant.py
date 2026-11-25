import os
import sys

# Use dedicated test database to isolate from production data
test_db_path = "./security_test_stockflow.db"
if os.path.exists(test_db_path):
    try:
        os.remove(test_db_path)
    except Exception:
        pass

os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"

from fastapi.testclient import TestClient
from main import app
from database import engine, Base

Base.metadata.create_all(bind=engine)
client = TestClient(app)

def run_security_verification():
    print("==================================================================")
    print("    StockFlow Backend Multi-Tenant Security Verification Suite    ")
    print("==================================================================\n")

    results = []

    # 1. Setup Organization A & User A
    print("[SETUP] Creating Organization A & User A...")
    res_a = client.post("/api/auth/signup", json={
        "organization_name": "Organization A",
        "email": "user_a@orga.com",
        "password": "Password123!"
    })
    assert res_a.status_code == 201, f"Failed to register Org A: {res_a.text}"
    token_a = res_a.json()["access_token"]
    org_a_id = res_a.json()["organization"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print(f" -> Organization A created (ID: {org_a_id}, User: user_a@orga.com)")

    # 2. Setup Organization B & User B
    print("[SETUP] Creating Organization B & User B...")
    res_b = client.post("/api/auth/signup", json={
        "organization_name": "Organization B",
        "email": "user_b@orgb.com",
        "password": "Password123!"
    })
    assert res_b.status_code == 201, f"Failed to register Org B: {res_b.text}"
    token_b = res_b.json()["access_token"]
    org_b_id = res_b.json()["organization"]["id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print(f" -> Organization B created (ID: {org_b_id}, User: user_b@orgb.com)")

    # 3. Add product under Organization A
    print("\n[SETUP] Creating product under Organization A...")
    prod_payload = {
        "name": "Secret Org A Drone",
        "sku": "DRONE-A-001",
        "description": "High-value enterprise drone belonging strictly to Org A",
        "quantity": 15,
        "cost_price": 450.0,
        "selling_price": 750.0,
        "low_stock_threshold": 5
    }
    res_prod = client.post("/api/products", headers=headers_a, json=prod_payload)
    assert res_prod.status_code == 201, f"Failed to create Org A product: {res_prod.text}"
    prod_a = res_prod.json()
    prod_a_id = prod_a["id"]
    print(f" -> Product created: ID={prod_a_id}, Name='{prod_a['name']}', SKU='{prod_a['sku']}', OrgID={prod_a['organization_id']}")

    print("\n------------------------------------------------------------------")
    print("EXECUTING CROSS-ORGANIZATION PENETRATION / SECURITY CHECKS:")
    print("------------------------------------------------------------------")

    # TEST 1: Retrieve Org A's product using Org B's token
    print("\n[TEST 1] Org B attempts to GET Org A's product by ID (GET /api/products/{id})...")
    res_t1 = client.get(f"/api/products/{prod_a_id}", headers=headers_b)
    # Expected: 404 Not Found (or 403 Forbidden) so Org B cannot read or enumerate Org A's data
    if res_t1.status_code in (403, 404):
        print(f" PASS: Access denied as expected with HTTP {res_t1.status_code} ({res_t1.json().get('detail')})")
        results.append(("Test 1: Retrieve Org A's product using Org B's token", "PASS", f"HTTP {res_t1.status_code}"))
    else:
        print(f" FAIL: Org B unexpectedly retrieved Org A's product! HTTP {res_t1.status_code}: {res_t1.text}")
        results.append(("Test 1: Retrieve Org A's product using Org B's token", "FAIL", f"HTTP {res_t1.status_code}"))

    # TEST 2: Update Org A's product using Org B's token
    print("\n[TEST 2] Org B attempts to UPDATE Org A's product (PUT /api/products/{id})...")
    malicious_update = {
        "name": "Compromised Drone by Org B",
        "quantity": 0,
        "selling_price": 0.01
    }
    res_t2 = client.put(f"/api/products/{prod_a_id}", headers=headers_b, json=malicious_update)
    if res_t2.status_code in (403, 404):
        # Verify that Org A's product was not mutated
        verify_prod = client.get(f"/api/products/{prod_a_id}", headers=headers_a).json()
        if verify_prod["name"] == prod_payload["name"] and verify_prod["quantity"] == prod_payload["quantity"]:
            print(f" PASS: Update blocked with HTTP {res_t2.status_code} ({res_t2.json().get('detail')}). Org A data intact.")
            results.append(("Test 2: Update Org A's product using Org B's token", "PASS", f"HTTP {res_t2.status_code} & unmutated"))
        else:
            print(" FAIL: Update request returned error but product data changed in DB!")
            results.append(("Test 2: Update Org A's product using Org B's token", "FAIL", "Data corrupted"))
    else:
        print(f" FAIL: Org B unexpectedly updated Org A's product! HTTP {res_t2.status_code}: {res_t2.text}")
        results.append(("Test 2: Update Org A's product using Org B's token", "FAIL", f"HTTP {res_t2.status_code}"))

    # TEST 3: Delete Org A's product using Org B's token
    print("\n[TEST 3] Org B attempts to DELETE Org A's product (DELETE /api/products/{id})...")
    res_t3 = client.delete(f"/api/products/{prod_a_id}", headers=headers_b)
    if res_t3.status_code in (403, 404):
        # Verify that Org A's product still exists
        res_verify_exist = client.get(f"/api/products/{prod_a_id}", headers=headers_a)
        if res_verify_exist.status_code == 200:
            print(f" PASS: Deletion blocked with HTTP {res_t3.status_code} ({res_t3.json().get('detail')}). Product still exists.")
            results.append(("Test 3: Delete Org A's product using Org B's token", "PASS", f"HTTP {res_t3.status_code} & preserved"))
        else:
            print(" FAIL: Deletion returned error but product was deleted from Org A!")
            results.append(("Test 3: Delete Org A's product using Org B's token", "FAIL", "Product missing"))
    else:
        print(f" FAIL: Org B unexpectedly deleted Org A's product! HTTP {res_t3.status_code}: {res_t3.text}")
        results.append(("Test 3: Delete Org A's product using Org B's token", "FAIL", f"HTTP {res_t3.status_code}"))

    # TEST 4: Access Organization A's dashboard data & inventory isolation
    print("\n[TEST 4] Org B accesses /api/dashboard and /api/products list...")
    res_t4_dash = client.get("/api/dashboard", headers=headers_b)
    res_t4_prods = client.get("/api/products", headers=headers_b)

    assert res_t4_dash.status_code == 200, f"Dashboard failed: {res_t4_dash.text}"
    assert res_t4_prods.status_code == 200, f"Products list failed: {res_t4_prods.text}"

    dash_b = res_t4_dash.json()
    prods_b = res_t4_prods.json()

    print(f" -> Org B Dashboard: total_products={dash_b['total_products']}, total_stock={dash_b['total_stock_quantity']}")
    print(f" -> Org B Products List count: {len(prods_b)}")

    # Org B has 0 products created yet, so dashboard and product list should reflect 0
    if dash_b["total_products"] == 0 and dash_b["total_stock_quantity"] == 0 and len(prods_b) == 0:
        # Also verify Org A sees its product on its dashboard
        dash_a = client.get("/api/dashboard", headers=headers_a).json()
        if dash_a["total_products"] == 1 and dash_a["total_stock_quantity"] == 15:
            print(" PASS: Org B only sees its own data (0 items). Org A dashboard data is completely isolated.")
            results.append(("Test 4: Access Organization A's dashboard data", "PASS", "Strict multi-tenant isolation verified"))
        else:
            print(" FAIL: Org A's dashboard data is inconsistent.")
            results.append(("Test 4: Access Organization A's dashboard data", "FAIL", "Org A dashboard mismatch"))
    else:
        print(f" FAIL: Leak detected! Org B dashboard shows: {dash_b}")
        results.append(("Test 4: Access Organization A's dashboard data", "FAIL", "Data leaked to Org B"))

    # TEST 5 (Bonus check): Org B searches with Org A's SKU
    print("\n[TEST 5] Org B searches for Org A's SKU via GET /api/products?search=DRONE-A-001...")
    res_search = client.get("/api/products?search=DRONE-A-001", headers=headers_b)
    if res_search.status_code == 200 and len(res_search.json()) == 0:
        print(" PASS: Search query is scoped to organization. Org A's SKU yields 0 results for Org B.")
        results.append(("Test 5: Product search scoping", "PASS", "0 cross-org results"))
    else:
        print(" FAIL: Org B search query returned Org A's product!")
        results.append(("Test 5: Product search scoping", "FAIL", "Search leaked"))

    print("\n==================================================================")
    print("                    FINAL VERIFICATION SUMMARY                    ")
    print("==================================================================")
    all_pass = True
    for name, status, detail in results:
        print(f"[{status}] {name} -> {detail}")
        if status != "PASS":
            all_pass = False

    print("==================================================================")
    print(f"OVERALL RESULT: {'PASS' if all_pass else 'FAIL'}")
    print("==================================================================")

    return all_pass

if __name__ == "__main__":
    success = run_security_verification()
    sys.exit(0 if success else 1)
