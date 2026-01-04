import { Elysia, t } from "elysia";
import { db } from "../db";
import { officers, officerAuth } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { sendOfficerCredentialsEmail } from "../lib/sendgrid";

// Helper: Generate username from first and last name
// Format: Off.firstnamelastname (capital O, lowercase names)
// Example: Off.jeremyranola
function generateOfficerUsername(firstName: string, lastName: string): string {
    const cleanFirst = firstName
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-zñáéíóúü]/g, ""); // Keep Spanish letters
    const cleanLast = lastName
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-zñáéíóúü]/g, ""); // Keep Spanish letters
    return `Off.${cleanFirst}${cleanLast}`;
}

// Helper: Generate password from badge number
// Format: {badge}-{Random4Chars} (1 upper, 1 lower, 1 number, 1 special)
// Example: 021971-Fc5*
function generateOfficerPassword(badgeNumber: string): string {
    const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    const NUMBERS = "0123456789";
    const SPECIAL = "!@#$%&*";

    // Generate 4 random characters (same as Android)
    const upper = UPPERCASE.charAt(Math.floor(Math.random() * UPPERCASE.length));
    const lower = LOWERCASE.charAt(Math.floor(Math.random() * LOWERCASE.length));
    const number = NUMBERS.charAt(Math.floor(Math.random() * NUMBERS.length));
    const special = SPECIAL.charAt(Math.floor(Math.random() * SPECIAL.length));

    return `${badgeNumber}-${upper}${lower}${number}${special}`;
}

export const adminOfficerRoutes = new Elysia({ prefix: "/admin/officers" })
    // Create new officer with auto-generated credentials
    .post(
        "/",
        async ({ body, set }) => {
            const {
                firstName,
                lastName,
                rank,
                badgeNumber,
                pnpNumber,
                contactNumber,
                email,
                gender,
                validIdFrontUrl,
                validIdBackUrl,
                idType,
            } = body;

            try {
                console.log("📝 Creating new officer...");
                console.log(`Name: ${firstName} ${lastName}`);
                console.log(`Rank: ${rank}`);
                console.log(`Badge: ${badgeNumber}`);

                // STEP 1: Generate credentials (SAME format as Android app)
                const username = generateOfficerUsername(firstName, lastName);
                const temporaryPassword = generateOfficerPassword(badgeNumber);

                console.log("🔑 Generated credentials:");
                console.log(`  Username: ${username}`);
                console.log(`  Password: ${temporaryPassword}`);

                // STEP 2: Check if username already exists in officer_auth
                const existingAuth = await db.query.officerAuth.findFirst({
                    where: eq(officerAuth.username, username),
                });

                if (existingAuth) {
                    set.status = 409;
                    return {
                        success: false,
                        message: "Username already exists",
                    };
                }

                // STEP 3: Create Officer record FIRST
                const fullName = `${firstName} ${lastName}`;
                const [newOfficer] = await db
                    .insert(officers)
                    .values({
                        name: fullName,
                        rank,
                        badgeNumber,
                        pnpNumber,
                        contactNumber,
                        email,
                        gender,
                        isActive: true,
                        validIdFrontUrl: validIdFrontUrl || null,
                        validIdBackUrl: validIdBackUrl || null,
                        idType: idType || null,
                    })
                    .returning();

                console.log(`✅ Officer created! OfficerID: ${newOfficer.id}`);

                // STEP 4: Hash password
                const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

                // STEP 5: Create Officer Auth record
                const [newAuth] = await db
                    .insert(officerAuth)
                    .values({
                        officerId: newOfficer.id,
                        username,
                        password: hashedPassword,
                        mustChangePassword: true, // Force password change on first login
                        isActive: true,
                    })
                    .returning();

                console.log(`✅ Officer auth created! AuthID: ${newAuth.id}`);

                // STEP 6: Send credentials email - DISABLED (manual send from Android app)
                // The Android app will handle email sending via device email client
                /*
                try {
                    await sendOfficerCredentialsEmail(
                        email,
                        `${firstName} ${lastName}`,
                        username,
                        temporaryPassword,
                        rank,
                        badgeNumber
                    );
                    console.log(`✅ Credentials email sent to ${email}`);
                } catch (emailError) {
                    console.error(`⚠️ Failed to send email, but officer was created:`, emailError);
                    // Don't fail the request if email fails
                }
                */
                console.log(`ℹ️ Email sending disabled - Android app will handle manual send`);

                // STEP 7: Return officer data + credentials
                return {
                    success: true,
                    message: "Officer created successfully",
                    data: {
                        officer: newOfficer,
                        auth: {
                            id: newAuth.id,
                            username: newAuth.username,
                        },
                        credentials: {
                            username,
                            password: temporaryPassword, // Plain text for email/display
                        },
                    },
                };
            } catch (error) {
                console.error("❌ Error creating officer:", error);
                set.status = 500;
                return {
                    success: false,
                    message: "Failed to create officer",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                };
            }
        },
        {
            body: t.Object({
                firstName: t.String(),
                lastName: t.String(),
                rank: t.String(),
                badgeNumber: t.String(),
                pnpNumber: t.String(),
                contactNumber: t.String(),
                email: t.String(),
                gender: t.String(),
                validIdFrontUrl: t.Optional(t.String()),
                validIdBackUrl: t.Optional(t.String()),
                idType: t.Optional(t.String()),
            }),
        }
    )

    // Get all officers (for Officer Management screen)
    .get("/", async () => {
        console.log("📋 Fetching all officers...");

        const allOfficers = await db.query.officers.findMany({
            orderBy: (officers, { desc }) => [desc(officers.createdAt)],
        });

        return {
            success: true,
            data: allOfficers,
            count: allOfficers.length,
        };
    })

    // Get officer by ID
    .get("/:id", async ({ params, set }) => {
        const officerId = parseInt(params.id);

        const officer = await db.query.officers.findFirst({
            where: eq(officers.id, officerId),
        });

        if (!officer) {
            set.status = 404;
            return { success: false, message: "Officer not found" };
        }

        return {
            success: true,
            data: officer,
        };
    })

    // Update officer
    .put(
        "/:id",
        async ({ params, body, set }) => {
            const officerId = parseInt(params.id);

            const [updatedOfficer] = await db
                .update(officers)
                .set({
                    ...body,
                    updatedAt: new Date(),
                })
                .where(eq(officers.id, officerId))
                .returning();

            if (!updatedOfficer) {
                set.status = 404;
                return { success: false, message: "Officer not found" };
            }

            return {
                success: true,
                message: "Officer updated successfully",
                data: updatedOfficer,
            };
        },
        {
            body: t.Partial(
                t.Object({
                    name: t.String(),
                    rank: t.String(),
                    contactNumber: t.String(),
                    email: t.String(),
                    isActive: t.Boolean(),
                })
            ),
        }
    )

    // Delete officer permanently
    .delete("/:id", async ({ params, set }) => {
        const officerId = parseInt(params.id);

        console.log(`🗑️ Deleting officer ID: ${officerId}`);

        try {
            // Get officer
            const officer = await db.query.officers.findFirst({
                where: eq(officers.id, officerId),
            });

            if (!officer) {
                set.status = 404;
                return { success: false, message: "Officer not found" };
            }

            // Delete linked officer_auth (CASCADE will handle this automatically)
            await db
                .delete(officerAuth)
                .where(eq(officerAuth.officerId, officerId));
            console.log(`✅ Deleted officer auth for ID: ${officerId}`);

            // Delete officer
            const [deletedOfficer] = await db
                .delete(officers)
                .where(eq(officers.id, officerId))
                .returning();

            console.log(`✅ Officer deleted: ${deletedOfficer.name}`);

            return {
                success: true,
                message: "Officer deleted successfully",
                data: deletedOfficer,
            };
        } catch (error) {
            console.error("❌ Error deleting officer:", error);
            set.status = 500;
            return {
                success: false,
                message: "Failed to delete officer",
                error:
                    error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
