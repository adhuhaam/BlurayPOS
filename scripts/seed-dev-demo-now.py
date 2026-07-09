#!/usr/bin/env python3
"""Apply demo catalog + sample sales to a running local API (no Docker rebuild needed)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:5142"


def request(method: str, path: str, token: str | None = None, body: dict | None = None, params: dict | None = None):
    url = BASE + path
    if params:
        qs = "&".join(f"{k}={v}" for k, v in params.items() if v is not None)
        url += ("?" + qs) if qs else ""
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        payload = e.read().decode()
        raise RuntimeError(f"{method} {path} -> {e.code}: {payload}") from e


def login(email: str, password: str, store_id: str | None = None) -> dict:
    body: dict = {"email": email, "password": password}
    if store_id:
        body["storeId"] = store_id
    data = request("POST", "/api/auth/login", body=body)
    if not data.get("success"):
        raise RuntimeError(data.get("error") or "login failed")
    return data["data"]


def main() -> int:
    try:
        urllib.request.urlopen(urllib.request.Request(BASE + "/health"))
    except Exception as exc:
        print(f"API not reachable at {BASE}: {exc}", file=sys.stderr)
        return 1

    manager = login("manager@demo.com", "Manager123!")
    store_id = manager["stores"][0]["id"]
    m_token = manager["accessToken"]

    cashier = login("cashier@demo.com", "Cashier123!", store_id)
    c_token = cashier["accessToken"]

    categories = {c["name"]: c["id"] for c in request("GET", "/api/categories", m_token)["data"]}
    for name, sort in [("Meals", 3), ("Desserts", 4)]:
        if name not in categories:
            created = request("POST", "/api/categories", m_token, {"name": name, "sortOrder": sort})
            categories[name] = created["data"]["id"]
            print(f"+ category {name}")

    products = {
        p["sku"]: p["id"]
        for p in request("GET", "/api/products", m_token, params={"storeId": store_id, "pageSize": 100})["data"]["items"]
    }

    catalog = [
        ("LIME-12", "Fresh Lime Juice", "100003", "Beverages", 25.00),
        ("ICED-COF", "Iced Coffee", "100004", "Beverages", 35.00),
        ("MANGO-SM", "Mango Smoothie", "100005", "Beverages", 45.00),
        ("KURU-01", "Kurukuru", "200003", "Snacks", 15.00),
        ("BIS-01", "Chocolate Biscuits", "200004", "Snacks", 12.00),
        ("FISH-RICE", "Fish Curry & Rice", "300001", "Meals", 85.00),
        ("CHK-ROLL", "Chicken Roll", "300002", "Meals", 55.00),
        ("VEG-NOOD", "Vegetable Noodles", "300003", "Meals", 65.00),
        ("ICE-CRM", "Ice Cream Cup", "400001", "Desserts", 30.00),
        ("GULAB-01", "Gulab Jamun", "400002", "Desserts", 25.00),
    ]

    for sku, name, barcode, cat, price in catalog:
        if sku in products:
            continue
        created = request(
            "POST",
            "/api/products",
            m_token,
            {
                "categoryId": categories[cat],
                "name": name,
                "sku": sku,
                "barcode": barcode,
                "basePrice": price,
                "taxRate": 0.08,
                "trackInventory": True,
                "initialStock": 100,
            },
            params={"storeId": store_id},
        )
        products[sku] = created["data"]["id"]
        print(f"+ product {name}")

    orders = request("GET", "/api/orders", c_token, params={"storeId": store_id, "status": "Completed", "pageSize": 1})
    if orders["data"]["totalCount"] > 0:
        print(f"Demo sales already present ({orders['data']['totalCount']} completed orders).")
    else:
        baskets = [
            [("COLA-12", 2), ("WATER-16", 1)],
            [("FISH-RICE", 1), ("ICED-COF", 1)],
            [("MANGO-SM", 2), ("BIS-01", 1)],
            [("CHK-ROLL", 2), ("WATER-16", 2)],
            [("VEG-NOOD", 1), ("ICE-CRM", 2), ("CHOC-BAR", 1)],
        ]
        for basket in baskets:
            lines = [{"productId": products[sku], "quantity": qty} for sku, qty in basket]
            order = request("POST", "/api/orders", c_token, {"lines": lines, "notes": "Demo seed order"})
            total = order["data"]["total"]
            request(
                "POST",
                f"/api/orders/{order['data']['id']}/complete",
                c_token,
                {"payments": [{"method": "Cash", "amount": total, "reference": "DEMO-CASH"}]},
            )
            print(f"+ completed order {order['data']['orderNumber']} ({total:.2f} MVR)")

    dash = request("GET", "/api/reports/dashboard", c_token, params={"storeId": store_id})
    if dash.get("success"):
        d = dash["data"]
        print(f"Dashboard: today {d['todayOrders']} orders / {d['todaySales']:.2f} MVR")
    else:
        print("Dashboard:", dash.get("error"))

    print("\nDemo ready. Logins: cashier@demo.com / Cashier123!  manager@demo.com / Manager123!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
