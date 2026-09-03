BEGIN;

-- ============================================================
-- C&S REPUESTOS
-- VALORIZACIÓN ACTUAL DEL INVENTARIO
-- ============================================================

CREATE OR REPLACE FUNCTION
  public.cys_inventory_valuation()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_product_count integer := 0;
  v_total_units bigint := 0;
  v_net_inventory_value bigint := 0;
  v_inventory_vat_value bigint := 0;
  v_inventory_cost_with_tax bigint := 0;
  v_potential_sales_value bigint := 0;
  v_potential_sales_net_value bigint := 0;
  v_potential_sales_vat_value bigint := 0;
  v_potential_profit bigint := 0;
  v_average_unit_cost_with_tax bigint := 0;
BEGIN
  IF NOT public.cys_has_permission(
    'statistics.read'
  ) THEN
    RAISE EXCEPTION
      'No autorizado.'
      USING ERRCODE = '42501';
  END IF;

  SELECT
    COUNT(*)::integer,
    COALESCE(
      SUM(p.stock::bigint),
      0
    )::bigint,
    COALESCE(
      SUM(
        p.net_price::bigint *
        p.stock::bigint
      ),
      0
    )::bigint,
    COALESCE(
      SUM(
        (
          p.price_with_tax::bigint -
          p.net_price::bigint
        ) *
        p.stock::bigint
      ),
      0
    )::bigint,
    COALESCE(
      SUM(
        p.price_with_tax::bigint *
        p.stock::bigint
      ),
      0
    )::bigint,
    COALESCE(
      SUM(
        p.price::bigint *
        p.stock::bigint
      ),
      0
    )::bigint,
    COALESCE(
      SUM(
        ROUND(
          p.price::numeric /
          1.19
        )::bigint *
        p.stock::bigint
      ),
      0
    )::bigint
  INTO
    v_product_count,
    v_total_units,
    v_net_inventory_value,
    v_inventory_vat_value,
    v_inventory_cost_with_tax,
    v_potential_sales_value,
    v_potential_sales_net_value
  FROM public.products p
  WHERE p.stock > 0;

  v_potential_sales_vat_value :=
    v_potential_sales_value -
    v_potential_sales_net_value;

  v_potential_profit :=
    v_potential_sales_net_value -
    v_net_inventory_value;

  IF v_total_units > 0 THEN
    v_average_unit_cost_with_tax :=
      ROUND(
        v_inventory_cost_with_tax::numeric /
        v_total_units::numeric
      )::bigint;
  END IF;

  RETURN jsonb_build_object(
    'productCount',
      v_product_count,
    'totalUnits',
      v_total_units,
    'netInventoryValue',
      v_net_inventory_value,
    'inventoryVatValue',
      v_inventory_vat_value,
    'inventoryCostWithTax',
      v_inventory_cost_with_tax,
    'averageUnitCostWithTax',
      v_average_unit_cost_with_tax,
    'potentialSalesValue',
      v_potential_sales_value,
    'potentialSalesNetValue',
      v_potential_sales_net_value,
    'potentialSalesVatValue',
      v_potential_sales_vat_value,
    'potentialProfit',
      v_potential_profit
  );
END;
$$;

REVOKE ALL ON FUNCTION
  public.cys_inventory_valuation()
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT EXECUTE ON FUNCTION
  public.cys_inventory_valuation()
TO
  authenticated,
  service_role;

COMMIT;
