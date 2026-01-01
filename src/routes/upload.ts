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

                // Validate base64 media (image or video)
                const isImage = photo && photo.startsWith("data:image/");
                const isVideo = photo && photo.startsWith("data:video/");

                if (!isImage && !isVideo) {
                    console.error("❌ Invalid media format - must be data:image/ or data:video/");
                    set.status = 400;
                    return { success: false, message: "Invalid media format" };
                }

                console.log(`✅ Media format validated: ${isImage ? 'image' : 'video'}`);

                // Upload to Cloudinary
                console.log("☁️ Uploading to Cloudinary...");
                const uploadResult = await cloudinary.uploader.upload(photo, {
                    folder: isImage ? "profile-pictures" : "evidence-videos",
                    public_id: `${isImage ? 'user' : 'evidence'}_${userId}_${Date.now()}`,
                    resource_type: isImage ? "image" : "video",
                    transformation: isImage ? [
                        { width: 500, height: 500, crop: "limit" },
                        { quality: "auto" },
                        { fetch_format: "auto" }
                    ] : undefined
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
