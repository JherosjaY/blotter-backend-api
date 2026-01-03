import { Elysia, t } from "elysia";
import { db } from "../db";
import { admins, users, officers, blotterReports } from "../db/schema";
import { eq, count, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export const adminRoutes = new Elysia({ prefix: "/admin" })
    // Admin Login (separate from user login)
    .post(
        "/login",
        async ({ body, set }) => {
            const { username, password } = body;

            console.log(`🔐 Admin login attempt: ${username}`);

            // Find admin by username
            const admin = await db.query.admins.findFirst({
                where: eq(admins.username, username),
            });

            if (!admin) {
                set.status = 401;
                return { success: false, message: "Invalid admin credentials" };
            }

            // Verify password
            const passwordMatch = await bcrypt.compare(password, admin.password);

            if (!passwordMatch) {
                set.status = 401;
                return { success: false, message: "Invalid admin credentials" };
            }

            // Generate admin token
            const token = Buffer.from(
                `admin:${admin.id}:${admin.username}:${Date.now()}`
            ).toString("base64");

            console.log(`✅ Admin login successful: ${username}`);

            return {
                success: true,
                message: "Admin login successful",
                data: {
                    admin: {
                        id: admin.id,
                        username: admin.username,
                        role: "admin",
                    },
                    token: token,
                },
            };
        },
        {
            body: t.Object({
                username: t.String(),
                password: t.String(),
            }),
        }
    )

    // Get all users (for User Management screen)
    .get("/users", async () => {
        console.log("📋 Fetching all users for admin");

        const allUsers = await db.query.users.findMany({
            columns: {
                password: false, // Exclude password
            },
            orderBy: (users, { desc }) => [desc(users.createdAt)],
        });

        return {
            success: true,
            data: allUsers,
            count: allUsers.length,
        };
    })

    // Terminate user (mark as inactive)
    .patch(
        "/users/:id/terminate",
        async ({ params, set }) => {
            const userId = parseInt(params.id);

            console.log(`⚠️ Terminating user ID: ${userId}`);

            try {
                // Check if user exists
                const user = await db.query.users.findFirst({
                    where: eq(users.id, userId),
                });

                if (!user) {
                    set.status = 404;
                    return { success: false, message: "User not found" };
                }

                // Mark user as inactive
                const [updatedUser] = await db
                    .update(users)
                    .set({
                        isActive: false,
                        updatedAt: new Date(),
                    })
                    .where(eq(users.id, userId))
                    .returning({
                        id: users.id,
                        username: users.username,
                        email: users.email,
                        isActive: users.isActive,
                    });

                console.log(`✅ User terminated: ${updatedUser.username}`);

                return {
                    success: true,
                    message: "User terminated successfully",
                    data: updatedUser,
                };
            } catch (error) {
                console.error("❌ Error terminating user:", error);
                set.status = 500;
                return {
                    success: false,
                    message: "Failed to terminate user",
                    error: error instanceof Error ? error.message : "Unknown error",
                };
            }
        }
    )

    // Delete user permanently
    .delete("/users/:id", async ({ params, set }) => {
        const userId = parseInt(params.id);

        console.log(`🗑️ Permanently deleting user ID: ${userId}`);

        try {
            // Check if user exists
            const user = await db.query.users.findFirst({
                where: eq(users.id, userId),
            });

            if (!user) {
                set.status = 404;
                return { success: false, message: "User not found" };
            }

            // Delete user permanently
            const [deletedUser] = await db
                .delete(users)
                .where(eq(users.id, userId))
                .returning({
                    id: users.id,
                    username: users.username,
                    email: users.email,
                });

            console.log(`✅ User permanently deleted: ${deletedUser.username}`);

            return {
                success: true,
                message: "User permanently deleted",
                data: deletedUser,
            };
        } catch (error) {
            console.error("❌ Error deleting user:", error);
            set.status = 500;
            return {
                success: false,
                message: "Failed to delete user",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    })

    // Get user details by ID
    .get("/users/:id", async ({ params, set }) => {
        const userId = parseInt(params.id);

        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: {
                password: false,
            },
        });

        if (!user) {
            set.status = 404;
            return { success: false, message: "User not found" };
        }

        return {
            success: true,
            data: user,
        };
    })

    // Get admin dashboard statistics
    .get("/dashboard/stats", async () => {
        try {
            console.log("📊 Fetching admin dashboard stats...");

            // Count total users
            const usersResult = await db
                .select({ count: count() })
                .from(users);

            const totalUsers = usersResult[0]?.count || 0;

            // Count total officers
            const officersResult = await db
                .select({ count: count() })
                .from(officers)
                .where(eq(officers.isActive, true));

            const totalOfficers = officersResult[0]?.count || 0;

            // Count total reports
            const reportsResult = await db
                .select({ count: count() })
                .from(blotterReports)
                .where(eq(blotterReports.isArchived, false));

            const totalReports = reportsResult[0]?.count || 0;

            // Count pending reports
            const pendingResult = await db
                .select({ count: count() })
                .from(blotterReports)
                .where(
                    and(
                        eq(blotterReports.status, "Pending"),
                        eq(blotterReports.isArchived, false)
                    )
                );

            const pendingReports = pendingResult[0]?.count || 0;

            console.log("✅ Admin Dashboard Stats:");
            console.log(`  Total Users: ${totalUsers}`);
            console.log(`  Total Officers: ${totalOfficers}`);
            console.log(`  Total Reports: ${totalReports}`);
            console.log(`  Pending Reports: ${pendingReports}`);

            return {
                success: true,
                data: {
                    totalUsers,
                    totalOfficers,
                    totalReports,
                    pendingReports,
                },
            };
        } catch (error) {
            console.error("❌ Error fetching admin dashboard stats:", error);
            return {
                success: false,
                message: "Failed to fetch dashboard statistics",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
