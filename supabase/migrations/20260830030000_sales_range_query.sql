BEGIN;

CREATE INDEX IF NOT EXISTS
  sales_sold_at_desc_idx
ON public.sales (sold_at DESC);

CREATE OR REPLACE FUNCTION
  public.cys_list_sales_range(
    p_start timestamptz,
    p_end timestamptz
  )
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.cys_is_authorized_user() THEN
    RAISE EXCEPTION 'No autorizado.'
      USING ERRCODE = '42501';
  END IF;

  IF
    p_start IS NULL
    OR p_end IS NULL
    OR p_start >= p_end
  THEN
    RAISE EXCEPTION
      'El rango de fechas no es válido.';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id::integer,
        'seller', COALESCE(
          s.seller_email,
          'Usuario eliminado'
        ),
        'soldAt', s.sold_at,
        'total', s.total_amount,
        'paymentMethod', s.payment_method,
        'installments', s.installments,
        'items',
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'productId', si.product_id::integer,
                  'name', si.product_name,
                  'quantity', si.quantity,
                  'unitPrice', si.unit_price
                )
                ORDER BY si.id
              )
              FROM public.sale_items si
              WHERE si.sale_id = s.id
            ),
            '[]'::jsonb
          )
      )
      ORDER BY s.sold_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_result
  FROM public.sales s
  WHERE
    s.sold_at >= p_start
    AND s.sold_at < p_end;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION
  public.cys_list_sales_range(
    timestamptz,
    timestamptz
  )
FROM
  PUBLIC,
  anon,
  authenticated;

GRANT EXECUTE ON FUNCTION
  public.cys_list_sales_range(
    timestamptz,
    timestamptz
  )
TO
  authenticated,
  service_role;

COMMIT;
