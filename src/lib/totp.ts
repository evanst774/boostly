// src/lib/totp.ts - Updated to use real account
import { Secret, TOTP } from '@otp-lib/authenticator';

// Generate a TOTP secret (returns base32 encoded string)
export function generateTOTPSecret(): string {
    const secret = Secret.create();
    return secret.toBase32();
}

// Generate QR code URL for Google Authenticator
export function generateTOTPUri(email: string, issuer: string, secretBase32: string): string {
    const secret = Secret.fromBase32(secretBase32);
    const totp = new TOTP({
        account: email,
        issuer: issuer,
        secret: secret,
    });
    return totp.toURI();
}

// Verify TOTP code using the user's email as account
export async function verifyTOTPCode(secretBase32: string, token: string, account: string): Promise<boolean> {
    try {
        const secret = Secret.fromBase32(secretBase32);
        const totp = new TOTP({
            account: account, // Use real account name
            secret: secret,
            window: 1, // Allow 1 step before/after for clock drift
        });
        return await totp.verify(token);
    } catch (error) {
        console.error('TOTP verification error:', error);
        return false;
    }
}

// Generate backup codes (10 codes, 8 digits each)
export function generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        const code = Math.floor(10000000 + Math.random() * 90000000).toString();
        codes.push(code);
    }
    return codes;
}

// Verify backup code
export function verifyBackupCode(inputCode: string, backupCodes: string[]): { valid: boolean; remainingCodes: string[] } {
    const index = backupCodes.findIndex(code => code === inputCode);
    if (index !== -1) {
        const newCodes = [...backupCodes];
        newCodes.splice(index, 1);
        return { valid: true, remainingCodes: newCodes };
    }
    return { valid: false, remainingCodes: backupCodes };
}