/**
 * Validate email format
 */
export function isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check if email domain looks valid (basic check)
 */
export async function isValidEmailDomain(email: string): Promise<boolean> {
    try {
        const domain = email.split('@')[1];
        if (!domain) return false;

        // Basic domain validation - check for common patterns
        // Reject obvious fake domains
        const fakeDomains = ['test', 'fake', 'example', 'localhost', 'invalid'];
        const lowerDomain = domain.toLowerCase();
        
        if (fakeDomains.some(fake => lowerDomain.includes(fake))) {
            return false;
        }

        // Check if domain has at least one dot and valid characters
        if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(domain)) {
            return false;
        }

        return true;
    } catch (err) {
        console.error(`Email domain validation failed for ${email}:`, err);
        return false;
    }
}

/**
 * Validate email (format + domain)
 */
export async function validateEmail(email: string): Promise<{ valid: boolean; error?: string }> {
    // Check format
    if (!isValidEmailFormat(email)) {
        return { valid: false, error: 'Invalid email format' };
    }

    // Check domain
    const domainValid = await isValidEmailDomain(email);
    if (!domainValid) {
        return { valid: false, error: 'Email domain is not valid' };
    }

    return { valid: true };
}

/**
 * Generate verification token
 */
export function generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
