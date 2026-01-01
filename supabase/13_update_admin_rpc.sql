-- Update the RPC function to include transaction_id
DROP FUNCTION IF EXISTS get_admin_withdrawals(text);

CREATE OR REPLACE FUNCTION get_admin_withdrawals(type_filter TEXT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    transaction_id UUID,
    amount NUMERIC,
    fee NUMERIC,
    address TEXT,
    network TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT 
        w.id,
        w.user_id,
        w.transaction_id,
        w.amount,
        w.fee,
        w.address,
        w.network,
        w.status,
        w.created_at,
        w.type
    FROM public.withdrawals w
    WHERE w.type = type_filter
    ORDER BY w.created_at DESC;
END;
$$;
