
import React from 'react';
import { Bitcoin, Zap, DollarSign } from 'lucide-react';

// Define a flexible type for the props
type IconProps = {
  className?: string;
  size?: number;
};

// A generic icon component that can be used as a fallback
const GenericCoin: React.FC<IconProps> = (props) => <DollarSign {...props} />;

export const ASSET_ICONS: Record<string, React.FC<IconProps>> = {
  BTC: (props) => <Bitcoin {...props} />,
  ETH: (props) => <Zap {...props} />, // Placeholder, consider a real ETH icon
  USDT: (props) => <DollarSign {...props} />,
  DEFAULT: GenericCoin,
};

export const getAssetIcon = (currency: string): React.FC<IconProps> => {
  const upperCurrency = currency.toUpperCase();
  return ASSET_ICONS[upperCurrency] || ASSET_ICONS.DEFAULT;
};
