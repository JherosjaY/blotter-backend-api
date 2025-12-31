import { Elysia, t } from "elysia";
import { cloudinary } from "../lib/cloudinary";

export const uploadRoutes = new Elysia({ prefix: "/upload" })

    // Upload profile photo to Cloudinary
    .post(
        "/profile-photo",
        async ({ body, set }) => {
            console.log("📸 ========== PHOTO UPLOAD REQUEST (Cloudinary) ==========");
            try {
                const { photo, userId } = body;
                console.log(`📸 Upload request for user ID: ${userId}`);

                // Validate base64 image
                if (!photo || !photo.startsWith("data:image/")) {
                    console.error("❌ Invalid image format - missing data:image/ prefix");
                    set.status = 400;
                    return { success: false, message: "Invalid image format" };
                }

                console.log("✅ Image format validated");

                // Upload to Cloudinary
                console.log("☁️ Uploading to Cloudinary...");
                const uploadResult = await cloudinary.uploader.upload(photo, {
                    folder: "profile-pictures",
                    public_id: `user_${userId}_${Date.now()}`,
                    resource_type: "image",
                    transformation: [
                        { width: 500, height: 500, crop: "limit" },
                        { quality: "auto" },
                        { fetch_format: "auto" }
                    ]
                });

                console.log(`✅ Upload successful!`);
                console.log(`🔗 Public URL: ${uploadResult.secure_url}`);
                console.log("📸 ========== UPLOAD COMPLETE ==========");

                return {
                    success: true,
                    message: "Profile photo uploaded successfully",
                    data: {
                        url: uploadResult.secure_url,
                        filename: uploadResult.public_id,
                    },
                };
            } catch (error: any) {
                console.error("❌ ========== UPLOAD ERROR ==========");
                console.error("Upload error:", error);
                console.error("Error message:", error.message);
                set.status = 500;
                return { success: false, message: "Failed to upload image", error: error.message };
            }
        },
        {
            body: t.Object({
                photo: t.String(), // Base64 encoded image
                userId: t.Number(),
            }),
        }
    );
