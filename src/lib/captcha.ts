/**
 * Cloudflare Turnstile CAPTCHA Verification Helper
 * 
 * This module provides functions to verify CAPTCHA tokens from Cloudflare Turnstile.
 * 
 * Environment Variables Required:
 * - CLOUDFLARE_TURNSTILE_SECRET_KEY: Your Cloudflare Turnstile secret key
 */

/**
 * Verify Cloudflare Turnstile CAPTCHA token
 * @param {string} token - The CAPTCHA token from frontend
 * @param {string} remoteIp - Optional: The user's IP address
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

    // Check if secret key is configured
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.error("❌ CLOUDFLARE_TURNSTILE_SECRET_KEY not configured in environment");
        return {
            success: false,
            message: "CAPTCHA verification not configured",
        };
    }

    try {
        console.log("🔍 Verifying CAPTCHA token...");

        // Call Cloudflare Turnstile verification API
        const response = await fetch(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    secret: secretKey,
                    response: token,
                    remoteip: remoteIp, // Optional
                }),
            }
        );

        const data = await response.json();

        if (data.success) {
            console.log("✅ CAPTCHA verification successful");
            return {
                success: true,
            };
        } else {
            console.error("❌ CAPTCHA verification failed:", data["error-codes"]);
            return {
                success: false,
                message: "CAPTCHA verification failed. Please try again.",
            };
        }
    } catch (error: any) {
        console.error("❌ Error verifying CAPTCHA:", error);
        return {
            success: false,
            message: "Failed to verify CAPTCHA. Please try again.",
        };
    }
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
