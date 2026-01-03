import { Elysia, t } from "elysia";
import { db } from "../db";
import { officers, officerAuth } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const officerRoutes = new Elysia({ prefix: "/officers" })
    // Change password (for force password change on first login)
    .patch(
        "/change-password",
        async ({ body, set }) => {
            const { officerId, currentPassword, newPassword } = body;

            try {
                console.log(`🔐 Officer ${officerId} changing password...`);

                // Get officer auth
                const auth = await db.query.officerAuth.findFirst({
                    where: eq(officerAuth.officerId, officerId),
                });

                if (!auth) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Officer authentication not found",
                    };
                }

                // Verify current password
                const isValid = await bcrypt.compare(
                    currentPassword,
                    auth.password
                );

                if (!isValid) {
                    set.status = 401;
                    return {
                        success: false,
                        message: "Current password is incorrect",
                    };
                }

                // Hash new password
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                // Update password and clear mustChangePassword flag
                await db
                    .update(officerAuth)
                    .set({
                        password: hashedPassword,
                        mustChangePassword: false,
                        updatedAt: new Date(),
                    })
                    .where(eq(officerAuth.officerId, officerId));

                console.log(`✅ Password changed for officer ${officerId}`);

                return {
                    success: true,
                    message: "Password changed successfully",
                };
            } catch (error) {
                console.error("❌ Error changing password:", error);
                set.status = 500;
                return {
                    success: false,
                    message: "Failed to change password",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                };
            }
        },
        {
            body: t.Object({
                officerId: t.Number(),
                currentPassword: t.String(),
                newPassword: t.String(),
            }),
        }
    )

    // Update duty status (On-Duty / Off-Duty)
    .patch(
        "/duty-status",
        async ({ body, set }) => {
            const { officerId, onDuty } = body;

            try {
                console.log(
                    `👮 Officer ${officerId} changing duty status to: ${onDuty ? "ON-DUTY" : "OFF-DUTY"}`
                );

                // Update officer duty status
                const [updatedOfficer] = await db
                    .update(officers)
                    .set({
                        onDuty,
                        updatedAt: new Date(),
                    })
                    .where(eq(officers.id, officerId))
                    .returning();

                if (!updatedOfficer) {
                    set.status = 404;
                    return {
                        success: false,
                        message: "Officer not found",
                    };
                }

                console.log(
                    `✅ Officer ${officerId} is now ${onDuty ? "ON-DUTY" : "OFF-DUTY"}`
                );

                return {
                    success: true,
                    message: `You are now ${onDuty ? "On-Duty" : "Off-Duty"}`,
                    data: updatedOfficer,
                };
            } catch (error) {
                console.error("❌ Error updating duty status:", error);
                set.status = 500;
                return {
                    success: false,
                    message: "Failed to update duty status",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                };
            }
        },
        {
            body: t.Object({
                officerId: t.Number(),
                onDuty: t.Boolean(),
            }),
        }
    )

    // Get officer by ID (for profile)
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

    // Get officer dashboard stats (case counts)
    .get("/:id/stats", async ({ params, set }) => {
        const officerId = parseInt(params.id);

        try {
            // Import blotterReports from schema
            const { blotterReports } = await import("../db/schema");

            // Get all cases (we'll filter in memory since assignedOfficerIds is an array)
            const allCases = await db.query.blotterReports.findMany();

            // Filter cases where this officer is assigned
            const assignedCases = allCases.filter((report) => {
                try {
                    const officerIds = report.assignedOfficerIds
                        ? JSON.parse(report.assignedOfficerIds as string)
                        : [];
                    return Array.isArray(officerIds) && officerIds.includes(officerId);
                } catch {
                    return false;
                }
            });

            // Count by status
            const totalAssigned = assignedCases.length;
            const assigned = assignedCases.filter(
                (c) => c.status === "Pending" || c.status === "Under Investigation"
            ).length;
            const active = assignedCases.filter(
                (c) => c.status === "Active" || c.status === "In Progress"
            ).length;
            const resolved = assignedCases.filter(
                (c) => c.status === "Resolved" || c.status === "Closed"
            ).length;

            return {
                success: true,
                data: {
                    totalAssigned,
                    assigned,
                    active,
                    resolved,
                },
            };
        } catch (error) {
            console.error("❌ Error fetching officer stats:", error);
            set.status = 500;
            return {
                success: false,
                message: "Failed to fetch officer stats",
                error:
                    error instanceof Error ? error.message : "Unknown error",
            };
        }
    });
