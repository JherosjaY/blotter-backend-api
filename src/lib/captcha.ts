/**
 * Custom Slider CAPTCHA Verification Helper
 * 
 * This module provides functions to verify CAPTCHA tokens from our custom slider CAPTCHA.
 * Accepts tokens in format: 'slider-verified-{timestamp}' or 'no-captcha' for registration
 */

/**
 * Verify Custom Slider CAPTCHA token
 * @param {string} token - The CAPTCHA token from frontend
 * @param {string} remoteIp - Optional: The user's IP address (not used for custom CAPTCHA)
 * @returns {Promise<{success: boolean, message?: string}>} - Verification result
 */
export async function verifyCaptcha(
    token: string,
    remoteIp?: string
): Promise<{ success: boolean; message?: string }> {
    // Check if token is provided
    if (!token) {
        console.error("❌ No CAPTCHA token provided");
        return {
            success: false,
            message: "CAPTCHA token is required",
        };
    }

    // Accept 'no-captcha' for registration (no CAPTCHA required)
    if (token === 'no-captcha') {
        console.log("✅ No CAPTCHA required (registration)");
        return {
            success: true,
        };
    }

    // Verify custom slider CAPTCHA token format
    if (token.startsWith('slider-verified-')) {
        console.log("✅ Custom slider CAPTCHA verified");
        return {
            success: true,
        };
    }

    // Invalid token format
    console.error("❌ Invalid CAPTCHA token format:", token);
    return {
        success: false,
        message: "Invalid CAPTCHA token. Please try again.",
    };
}

/**
 * Middleware to verify CAPTCHA before processing request
 * Usage: Add this to your route handlers that need CAPTCHA protection
 */
export async function requireCaptcha(
    captchaToken: string | undefined,
    remoteIp?: string
): Promise<{ valid: boolean; error?: string }> {
    if (!captchaToken) {
        return {
            valid: false,
            error: "CAPTCHA token is missing",
        };
    }

    const result = await verifyCaptcha(captchaToken, remoteIp);

    if (!result.success) {
        return {
            valid: false,
            error: result.message || "CAPTCHA verification failed",
        };
    }

    return { valid: true };
}
