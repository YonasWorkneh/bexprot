/**
 * Generates a QR code data URL for a wallet address
 * This is a placeholder - the actual QR generation will be done by qrcode.react component
 */
export const generateQRCodeData = (address: string, amount?: number, asset?: string): string => {
    let data = address;

    // For Ethereum, we can use EIP-681 format
    if (address.startsWith('0x')) {
        if (amount && asset) {
            data = `ethereum:${address}?value=${amount}&token=${asset}`;
        } else {
            data = `ethereum:${address}`;
        }
    }

    // For Solana
    if (!address.startsWith('0x')) {
        if (amount && asset) {
            data = `solana:${address}?amount=${amount}&spl-token=${asset}`;
        } else {
            data = `solana:${address}`;
        }
    }

    return data;
};

/**
 * Parses QR code data to extract address and optional payment details
 */
export const parseQRCodeData = (data: string): {
    address: string;
    amount?: number;
    asset?: string;
    network?: 'ethereum' | 'solana';
} => {
    // Handle Ethereum URI format (EIP-681)
    if (data.startsWith('ethereum:')) {
        const url = new URL(data);
        const address = url.pathname;
        const amount = url.searchParams.get('value');
        const asset = url.searchParams.get('token');

        return {
            address,
            amount: amount ? parseFloat(amount) : undefined,
            asset: asset || undefined,
            network: 'ethereum',
        };
    }

    // Handle Solana URI format
    if (data.startsWith('solana:')) {
        const url = new URL(data);
        const address = url.pathname;
        const amount = url.searchParams.get('amount');
        const asset = url.searchParams.get('spl-token');

        return {
            address,
            amount: amount ? parseFloat(amount) : undefined,
            asset: asset || undefined,
            network: 'solana',
        };
    }

    // Plain address
    return {
        address: data,
        network: data.startsWith('0x') ? 'ethereum' : 'solana',
    };
};

/**
 * Validates QR code data
 */
export const isValidQRCodeData = (data: string): boolean => {
    try {
        const parsed = parseQRCodeData(data);
        return !!parsed.address && parsed.address.length > 0;
    } catch {
        return false;
    }
};
