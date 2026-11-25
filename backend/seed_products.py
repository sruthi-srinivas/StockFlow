from database import SessionLocal
import models

sample_products = [
    {
        "name": "Rice Bag 25kg",
        "sku": "RICE001",
        "quantity": 100,
        "cost_price": 900.0,
        "selling_price": 1100.0,
        "low_stock_threshold": 10,
    },
    {
        "name": "Sugar 5kg",
        "sku": "SUGAR001",
        "quantity": 3,
        "cost_price": 180.0,
        "selling_price": 220.0,
        "low_stock_threshold": 5,
    },
    {
        "name": "Sunflower Oil 1L",
        "sku": "OIL001",
        "quantity": 25,
        "cost_price": 110.0,
        "selling_price": 140.0,
        "low_stock_threshold": 5,
    },
    {
        "name": "Wheat Flour 10kg",
        "sku": "WHEAT001",
        "quantity": 50,
        "cost_price": 320.0,
        "selling_price": 400.0,
        "low_stock_threshold": 10,
    },
    {
        "name": "Toor Dal 1kg",
        "sku": "DAL001",
        "quantity": 2,
        "cost_price": 130.0,
        "selling_price": 160.0,
        "low_stock_threshold": 5,
    },
]

def seed_sample_products():
    db = SessionLocal()
    try:
        org = db.query(models.Organization).first()
        if not org:
            print("Error: No existing organization found.")
            return

        print(f"Using Organization: ID={org.id}, Name='{org.name}'")

        added_count = 0
        for item in sample_products:
            existing = db.query(models.Product).filter(
                models.Product.organization_id == org.id,
                models.Product.sku == item["sku"]
            ).first()

            if existing:
                print(f"Skipping: Product with SKU '{item['sku']}' already exists.")
            else:
                product = models.Product(
                    organization_id=org.id,
                    name=item["name"],
                    sku=item["sku"],
                    quantity=item["quantity"],
                    cost_price=item["cost_price"],
                    selling_price=item["selling_price"],
                    low_stock_threshold=item["low_stock_threshold"]
                )
                db.add(product)
                added_count += 1
                print(f"Added product: {item['name']} ({item['sku']})")

        db.commit()
        print(f"\nSuccessfully committed {added_count} products.")

        # Verification step
        products = db.query(models.Product).filter(models.Product.organization_id == org.id).all()
        total_products = len(products)
        total_quantity = sum(p.quantity for p in products)
        
        low_stock_items = []
        for p in products:
            thresh = p.low_stock_threshold if p.low_stock_threshold is not None else org.default_low_stock_threshold
            if p.quantity <= thresh:
                low_stock_items.append(p)

        print("\n--- Verification Summary ---")
        print(f"Total Products: {total_products}")
        print(f"Total Stock Units: {total_quantity}")
        print(f"Low Stock Count: {len(low_stock_items)}")
        print("Low Stock Products:")
        for p in low_stock_items:
            print(f" - {p.name} (SKU: {p.sku}, Qty: {p.quantity}, Threshold: {p.low_stock_threshold})")

    finally:
        db.close()

if __name__ == "__main__":
    seed_sample_products()
