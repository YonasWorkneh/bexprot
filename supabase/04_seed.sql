-- Initial System Settings
INSERT INTO public.system_settings (id, contract_trading_enabled, contract_outcome_mode, withdrawal_enabled)
VALUES (uuid_generate_v4(), true, 'fair', true)
ON CONFLICT DO NOTHING;

-- Initial Deposit Addresses (Example - Replace with real ones)
INSERT INTO public.crypto_deposit_addresses (currency, network, network_symbol, address, min_deposit)
VALUES 
('USDT', 'TRC20', 'TRX', 'T9yD14Nj9j7xAB4dbGeiX9h8unkkhxn', 10),
('BTC', 'Bitcoin', 'BTC', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0.001),
('ETH', 'Ethereum', 'ETH', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 0.01)
ON CONFLICT DO NOTHING;
