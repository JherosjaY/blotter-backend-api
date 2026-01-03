import { Elysia, t } from "elysia";

export const smsRoutes = new Elysia({ prefix: "/sms" })

    // Send SMS via Semaphore API
    .post(
        "/send",
        async ({ body, set }) => {
            console.log("📱 ========== SMS SEND REQUEST ==========");
            try {
                const { phoneNumber, message } = body;

                console.log(`📱 Sending SMS to: ${phoneNumber}`);
                console.log(`📝 Message: ${message}`);

                // Call Semaphore API
                const response = await fetch("https://api.semaphore.co/api/v4/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        apikey: process.env.SEMAPHORE_API_KEY,
                        number: phoneNumber,
                        message: message,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    console.error("❌ Semaphore API error:", result);
                    set.status = response.status;
                    return {
                        success: false,
                        message: "Failed to send SMS",
                        error: result,
                    };
                }

                console.log("✅ SMS sent successfully!");
                console.log(`📊 Result:`, result);
                console.log("📱 ========== SMS SEND COMPLETE ==========");

                return {
                    success: true,
                    message: "SMS sent successfully",
                    data: result,
                };
            } catch (error: any) {
                console.error("❌ ========== SMS SEND ERROR ==========");
                console.error("Error:", error);
                set.status = 500;
                return {
                    success: false,
                    message: "Failed to send SMS",
                    error: error.message,
                };
            }
        },
        {
            body: t.Object({
                phoneNumber: t.String(), // PH format: 09XXXXXXXXX
                message: t.String(),
            }),
        }
    );
