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
    )

    // ✅ NEW: Upload blotter evidence (photos and videos)
    .post(
        "/blotter-evidence",
        async ({ body, set }) => {
            console.log("📸 ========== BLOTTER EVIDENCE UPLOAD ==========");
            try {
                const { files, caseNumber, userId } = body;

                // Validate file count
                if (files.length > 10) {
                    set.status = 400;
                    return {
                        success: false,
                        message: "Maximum 10 files allowed (5 photos + 5 videos)"
                    };
                }

                const uploadedUrls: string[] = [];
                let photoCount = 0;
                let videoCount = 0;

                for (const file of files) {
                    const isImage = file.startsWith("data:image/");
                    const isVideo = file.startsWith("data:video/");

                    if (!isImage && !isVideo) {
                        console.warn("⚠️ Skipping invalid file format");
                        continue;
                    }

                    // Validate counts
                    if (isImage && photoCount >= 5) {
                        console.warn("⚠️ Maximum 5 photos reached, skipping");
                        continue;
                    }
                    if (isVideo && videoCount >= 5) {
                        console.warn("⚠️ Maximum 5 videos reached, skipping");
                        continue;
                    }

                    console.log(`☁️ Uploading ${isImage ? 'photo' : 'video'} ${isImage ? photoCount + 1 : videoCount + 1}...`);

                    // Upload to Cloudinary
                    const uploadResult = await cloudinary.uploader.upload(file, {
                        folder: isImage ? "blotter-evidence/photos" : "blotter-evidence/videos",
                        public_id: `${caseNumber}_${isImage ? 'photo' : 'video'}_${Date.now()}`,
                        resource_type: isImage ? "image" : "video",
                        transformation: isImage ? [
                            { width: 1920, height: 1080, crop: "limit" },
                            { quality: "auto" },
                            { fetch_format: "auto" }
                        ] : undefined,
                        // Video-specific settings
                        ...(isVideo && {
                            eager: [
                                {
                                    width: 1280,
                                    height: 720,
                                    crop: "limit",
                                    video_codec: "h264",
                                    audio_codec: "aac"
                                }
                            ],
                            eager_async: true,
                        })
                    });

                    uploadedUrls.push(uploadResult.secure_url);

                    if (isImage) photoCount++;
                    if (isVideo) videoCount++;

                    console.log(`✅ Uploaded: ${uploadResult.secure_url}`);
                }

                console.log(`✅ Upload complete: ${photoCount} photos, ${videoCount} videos`);
                console.log("📸 ========== UPLOAD COMPLETE ==========");

                return {
                    success: true,
                    message: `Uploaded ${photoCount} photos and ${videoCount} videos`,
                    data: {
                        urls: uploadedUrls,
                        photoCount,
                        videoCount,
                    },
                };
            } catch (error: any) {
                console.error("❌ ========== UPLOAD ERROR ==========");
                console.error("Upload error:", error);
                set.status = 500;
                return {
                    success: false,
                    message: "Failed to upload evidence",
                    error: error.message
                };
            }
        },
        {
            body: t.Object({
                files: t.Array(t.String()), // Array of base64 encoded files
                caseNumber: t.String(),
                userId: t.Number(),
            }),
        }
    )

    // ✅ NEW: Upload single evidence file (photo or video)
    .post(
        "/blotter-evidence/single",
        async ({ body, set }) => {
            console.log("📸 ========== SINGLE EVIDENCE UPLOAD ==========");
            try {
                const { file, caseNumber, userId, fileType } = body;

                const isImage = file.startsWith("data:image/");
                const isVideo = file.startsWith("data:video/");

                if (!isImage && !isVideo) {
                    set.status = 400;
                    return { success: false, message: "Invalid file format" };
                }

                console.log(`☁️ Uploading ${isImage ? 'photo' : 'video'}...`);

                // Upload to Cloudinary
                const uploadResult = await cloudinary.uploader.upload(file, {
                    folder: isImage ? "blotter-evidence/photos" : "blotter-evidence/videos",
                    public_id: `${caseNumber}_${fileType || (isImage ? 'photo' : 'video')}_${Date.now()}`,
                    resource_type: isImage ? "image" : "video",
                    transformation: isImage ? [
                        { width: 1920, height: 1080, crop: "limit" },
                        { quality: "auto" },
                        { fetch_format: "auto" }
                    ] : undefined,
                    // Video-specific settings
                    ...(isVideo && {
                        eager: [
                            {
                                width: 1280,
                                height: 720,
                                crop: "limit",
                                video_codec: "h264",
                                audio_codec: "aac"
                            }
                        ],
                        eager_async: true,
                    })
                });

                console.log(`✅ Upload successful: ${uploadResult.secure_url}`);
                console.log("📸 ========== UPLOAD COMPLETE ==========");

                return {
                    success: true,
                    message: `${isImage ? 'Photo' : 'Video'} uploaded successfully`,
                    data: {
                        url: uploadResult.secure_url,
                        filename: uploadResult.public_id,
                        resourceType: isImage ? "image" : "video",
                        duration: uploadResult.duration || null, // Video duration in seconds
                    },
                };
            } catch (error: any) {
                console.error("❌ ========== UPLOAD ERROR ==========");
                console.error("Upload error:", error);
                set.status = 500;
                return {
                    success: false,
                    message: "Failed to upload file",
                    error: error.message
                };
            }
        },
        {
            body: t.Object({
                file: t.String(), // Base64 encoded file
                caseNumber: t.String(),
                userId: t.Number(),
                fileType: t.Optional(t.String()), // "photo" or "video"
            }),
        }
    );
