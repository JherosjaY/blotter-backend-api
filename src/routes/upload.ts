import { Elysia, t } from "elysia";
import { supabase } from "../lib/supabase";
import { randomBytes } from "crypto";

export const uploadRoutes = new Elysia({ prefix: "/api/upload" })

    // Upload profile photo to Supabase Storage
    .post(
        "/profile-photo",
        async ({ body, set }) => {
            try {
                const { photo, userId } = body;

                // Validate base64 image
                if (!photo || !photo.startsWith("data:image/")) {
                    set.status = 400;
                    return { success: false, message: "Invalid image format" };
                }

                // Extract base64 data and mime type
                const matches = photo.match(/^data:image\/(\w+);base64,(.+)$/);
                if (!matches) {
                    set.status = 400;
                    return { success: false, message: "Invalid base64 image" };
                }

                const mimeType = matches[1]; // jpeg, png, webp
                const base64Data = matches[2];

                // Convert base64 to buffer
                const buffer = Buffer.from(base64Data, "base64");

                // Validate file size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (buffer.length > maxSize) {
                    set.status = 400;
                    return { success: false, message: "Image too large. Max size is 5MB" };
                }

                // Generate unique filename
                const timestamp = Date.now();
                const randomString = randomBytes(8).toString("hex");
                const filename = `${userId}_${timestamp}_${randomString}.${mimeType}`;

                // Upload to Supabase Storage
                const { data, error } = await supabase.storage
                    .from("profile-pictures")
                    .upload(filename, buffer, {
                        contentType: `image/${mimeType}`,
                        cacheControl: "3600",
                        upsert: false,
                    });

                if (error) {
                    console.error("Supabase upload error:", error);
                    set.status = 500;
                    return { success: false, message: "Failed to upload image" };
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from("profile-pictures")
                    .getPublicUrl(filename);

                return {
                    success: true,
                    message: "Profile photo uploaded successfully",
                    data: {
                        url: urlData.publicUrl,
                        filename: filename,
                    },
                };
            } catch (error) {
                console.error("Upload error:", error);
                set.status = 500;
                return { success: false, message: "Internal server error" };
            }
        },
        {
            body: t.Object({
                photo: t.String(), // Base64 encoded image
                userId: t.Number(),
            }),
        }
    );
