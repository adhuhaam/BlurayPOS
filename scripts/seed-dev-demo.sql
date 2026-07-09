-- Helper: insert one completed demo order from product SKUs.
CREATE OR REPLACE FUNCTION seed_demo_order(
  p_org_id uuid,
  p_store_id uuid,
  p_cashier_id uuid,
  p_order_number text,
  p_completed_at timestamptz,
  p_skus text[],
  p_qtys int[]
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  i int;
  v_product record;
  v_line_subtotal numeric;
  v_line_tax numeric;
  v_lines jsonb := '[]'::jsonb;
BEGIN
  FOR i IN 1 .. array_length(p_skus, 1) LOOP
    SELECT "Id", "Name", "Sku", "BasePrice", "TaxRate"
    INTO v_product
    FROM "Products"
    WHERE "OrganizationId" = p_org_id AND "Sku" = p_skus[i];

    v_line_subtotal := v_product."BasePrice" * p_qtys[i];
    v_line_tax := v_line_subtotal * v_product."TaxRate";
    v_subtotal := v_subtotal + v_line_subtotal;
    v_tax := v_tax + v_line_tax;

    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product."Id",
      'product_name', v_product."Name",
      'sku', v_product."Sku",
      'quantity', p_qtys[i],
      'unit_price', v_product."BasePrice",
      'tax_rate', v_product."TaxRate",
      'line_total', v_line_subtotal + v_line_tax
    );
  END LOOP;

  v_total := v_subtotal + v_tax;

  INSERT INTO "Orders" (
    "Id", "OrganizationId", "StoreId", "CashierUserId", "OrderNumber", "Status",
    "Subtotal", "TaxAmount", "DiscountAmount", "Total", "Notes",
    "CompletedAt", "CreatedAt", "IsDeleted"
  ) VALUES (
    v_order_id, p_org_id, p_store_id, p_cashier_id, p_order_number, 1,
    v_subtotal, v_tax, 0, v_total, 'Demo seed order',
    p_completed_at, p_completed_at - INTERVAL '5 minutes', false
  );

  FOR i IN 0 .. jsonb_array_length(v_lines) - 1 LOOP
    INSERT INTO "OrderLines" (
      "Id", "OrganizationId", "OrderId", "ProductId", "ProductName", "Sku",
      "Quantity", "UnitPrice", "TaxRate", "DiscountAmount", "LineTotal", "CreatedAt", "IsDeleted"
    ) VALUES (
      gen_random_uuid(),
      p_org_id,
      v_order_id,
      (v_lines -> i ->> 'product_id')::uuid,
      v_lines -> i ->> 'product_name',
      v_lines -> i ->> 'sku',
      (v_lines -> i ->> 'quantity')::int,
      (v_lines -> i ->> 'unit_price')::numeric,
      (v_lines -> i ->> 'tax_rate')::numeric,
      0,
      (v_lines -> i ->> 'line_total')::numeric,
      p_completed_at,
      false
    );
  END LOOP;

  INSERT INTO "Payments" (
    "Id", "OrganizationId", "OrderId", "Method", "Status", "Amount", "Reference", "CreatedAt", "IsDeleted"
  ) VALUES (
    gen_random_uuid(), p_org_id, v_order_id, 0, 1, v_total, 'DEMO-CASH', p_completed_at, false
  );
END $$;

-- Apply demo user access, customers, and sample completed sales (idempotent).
DO $$
DECLARE
  org_id uuid;
  store_id uuid;
  cashier_id uuid;
BEGIN
  SELECT "Id" INTO org_id FROM "Organizations" WHERE "Slug" = 'demo';
  SELECT "Id" INTO store_id FROM "Stores" WHERE "OrganizationId" = org_id AND "Code" = 'MAIN';
  SELECT "Id" INTO cashier_id FROM "AspNetUsers" WHERE "Email" = 'cashier@demo.com';

  IF org_id IS NULL OR store_id IS NULL THEN
    RAISE NOTICE 'Demo organization not found — start API once to run migrations/seed.';
    RETURN;
  END IF;

  UPDATE "AspNetUsers"
  SET "DefaultStoreId" = store_id
  WHERE "Email" IN ('manager@demo.com', 'waiter@demo.com', 'cashier@demo.com')
    AND ("DefaultStoreId" IS NULL OR "DefaultStoreId" <> store_id);

  INSERT INTO "UserStoreAssignments" ("UserId", "StoreId")
  SELECT u."Id", store_id
  FROM "AspNetUsers" u
  WHERE u."Email" IN ('manager@demo.com', 'waiter@demo.com', 'cashier@demo.com')
  ON CONFLICT DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM "Customers" WHERE "OrganizationId" = org_id) THEN
    INSERT INTO "Customers" ("Id", "OrganizationId", "FirstName", "LastName", "Email", "Phone", "LoyaltyPoints", "CreatedAt", "IsDeleted")
    VALUES
      (gen_random_uuid(), org_id, 'Ahmed', 'Hassan', 'ahmed@example.mv', '+960 770-0001', 0, NOW(), false),
      (gen_random_uuid(), org_id, 'Aisha', 'Mohamed', 'aisha@example.mv', '+960 770-0002', 0, NOW(), false);
  END IF;

  IF EXISTS (SELECT 1 FROM "Orders" WHERE "OrganizationId" = org_id AND "Status" = 1) THEN
    RETURN;
  END IF;

  DELETE FROM "Orders" WHERE "OrganizationId" = org_id AND "Status" = 0;

  PERFORM seed_demo_order(org_id, store_id, cashier_id, 'DEMO-0001', NOW() - INTERVAL '2 hours',
    ARRAY['COLA-12', 'WATER-16'], ARRAY[2, 1]);
  PERFORM seed_demo_order(org_id, store_id, cashier_id, 'DEMO-0002', NOW() - INTERVAL '1 hour',
    ARRAY['FISH-RICE', 'ICED-COF'], ARRAY[1, 1]);
  PERFORM seed_demo_order(org_id, store_id, cashier_id, 'DEMO-0003', NOW() - INTERVAL '30 minutes',
    ARRAY['MANGO-SM', 'BIS-01'], ARRAY[2, 1]);
  PERFORM seed_demo_order(org_id, store_id, cashier_id, 'DEMO-0004', NOW() - INTERVAL '1 day',
    ARRAY['CHK-ROLL', 'WATER-16'], ARRAY[2, 2]);
  PERFORM seed_demo_order(org_id, store_id, cashier_id, 'DEMO-0005', NOW() - INTERVAL '2 days',
    ARRAY['VEG-NOOD', 'ICE-CRM', 'CHOC-BAR'], ARRAY[1, 2, 1]);
END $$;
