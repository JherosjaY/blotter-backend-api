import { Elysia, t } from "elysia";
import { db } from "../db";
import { witnesses, suspects, evidence, hearings, resolutions } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const investigationRoutes = new Elysia({ prefix: "/investigation" })

    // ==================== WITNESSES ====================

    // Get all witnesses for a case
    .get("/witnesses/:reportId", async ({ params }) => {
        const reportId = parseInt(params.reportId);

        const witnessesData = await db.query.witnesses.findMany({
            where: eq(witnesses.blotterReportId, reportId),
            orderBy: desc(witnesses.createdAt),
        });

        console.log(`📋 Found ${witnessesData.length} witnesses for report ${reportId}`);

        return {
            success: true,
            data: witnessesData,
        };
    })

    // Add witness
    .post(
        "/witnesses",
        async ({ body }) => {
            const [newWitness] = await db
                .insert(witnesses)
                .values(body)
                .returning();

            console.log(`✅ Witness added: ${newWitness.name} for report ${newWitness.blotterReportId}`);

            return {
                success: true,
                data: newWitness,
            };
        },
        {
            body: t.Object({
                blotterReportId: t.Number(),
                name: t.String(),
                contactNumber: t.Optional(t.String()),
                address: t.Optional(t.String()),
                statement: t.Optional(t.String()),
            }),
        }
    )

    // Update witness
    .put(
        "/witnesses/:id",
        async ({ params, body, set }) => {
            const [updatedWitness] = await db
                .update(witnesses)
                .set(body)
                .where(eq(witnesses.id, parseInt(params.id)))
                .returning();

            if (!updatedWitness) {
                set.status = 404;
                return { success: false, message: "Witness not found" };
            }

            return {
                success: true,
                data: updatedWitness,
            };
        },
        {
            body: t.Partial(
                t.Object({
                    name: t.String(),
                    contactNumber: t.String(),
                    address: t.String(),
                    statement: t.String(),
                })
            ),
        }
    )

    // Delete witness
    .delete("/witnesses/:id", async ({ params, set }) => {
        const [deletedWitness] = await db
            .delete(witnesses)
            .where(eq(witnesses.id, parseInt(params.id)))
            .returning();

        if (!deletedWitness) {
            set.status = 404;
            return { success: false, message: "Witness not found" };
        }

        return {
            success: true,
            message: "Witness deleted successfully",
        };
    })

    // ==================== SUSPECTS ====================

    // Get all suspects for a case
    .get("/suspects/:reportId", async ({ params }) => {
        const reportId = parseInt(params.reportId);

        const suspectsData = await db.query.suspects.findMany({
            where: eq(suspects.blotterReportId, reportId),
            orderBy: desc(suspects.createdAt),
        });

        console.log(`📋 Found ${suspectsData.length} suspects for report ${reportId}`);

        return {
            success: true,
            data: suspectsData,
        };
    })

    // Add suspect
    .post(
        "/suspects",
        async ({ body }) => {
            const [newSuspect] = await db
                .insert(suspects)
                .values(body)
                .returning();

            console.log(`✅ Suspect added: ${newSuspect.name} for report ${newSuspect.blotterReportId}`);

            return {
                success: true,
                data: newSuspect,
            };
        },
        {
            body: t.Object({
                blotterReportId: t.Number(),
                name: t.String(),
                age: t.Optional(t.Number()),
                address: t.Optional(t.String()),
                description: t.Optional(t.String()),
            }),
        }
    )

    // Update suspect
    .put(
        "/suspects/:id",
        async ({ params, body, set }) => {
            const [updatedSuspect] = await db
                .update(suspects)
                .set(body)
                .where(eq(suspects.id, parseInt(params.id)))
                .returning();

            if (!updatedSuspect) {
                set.status = 404;
                return { success: false, message: "Suspect not found" };
            }

            return {
                success: true,
                data: updatedSuspect,
            };
        },
        {
            body: t.Partial(
                t.Object({
                    name: t.String(),
                    age: t.Number(),
                    address: t.String(),
                    description: t.String(),
                })
            ),
        }
    )

    // Delete suspect
    .delete("/suspects/:id", async ({ params, set }) => {
        const [deletedSuspect] = await db
            .delete(suspects)
            .where(eq(suspects.id, parseInt(params.id)))
            .returning();

        if (!deletedSuspect) {
            set.status = 404;
            return { success: false, message: "Suspect not found" };
        }

        return {
            success: true,
            message: "Suspect deleted successfully",
        };
    })

    // ==================== HEARINGS ====================

    // Get all hearings for a case
    .get("/hearings/:reportId", async ({ params }) => {
        const reportId = parseInt(params.reportId);

        const hearingsData = await db.query.hearings.findMany({
            where: eq(hearings.blotterReportId, reportId),
            orderBy: desc(hearings.createdAt),
        });

        console.log(`📋 Found ${hearingsData.length} hearings for report ${reportId}`);

        return {
            success: true,
            data: hearingsData,
        };
    })

    // Schedule hearing
    .post(
        "/hearings",
        async ({ body }) => {
            const [newHearing] = await db
                .insert(hearings)
                .values(body)
                .returning();

            console.log(`✅ Hearing scheduled for report ${newHearing.blotterReportId} on ${newHearing.hearingDate}`);

            return {
                success: true,
                data: newHearing,
            };
        },
        {
            body: t.Object({
                blotterReportId: t.Number(),
                hearingDate: t.String(),
                hearingTime: t.String(),
                location: t.String(),
                purpose: t.Optional(t.String()),
                presidingOfficer: t.Optional(t.String()),
                notes: t.Optional(t.String()),
            }),
        }
    )

    // Update hearing
    .put(
        "/hearings/:id",
        async ({ params, body, set }) => {
            const [updatedHearing] = await db
                .update(hearings)
                .set(body)
                .where(eq(hearings.id, parseInt(params.id)))
                .returning();

            if (!updatedHearing) {
                set.status = 404;
                return { success: false, message: "Hearing not found" };
            }

            return {
                success: true,
                data: updatedHearing,
            };
        },
        {
            body: t.Partial(
                t.Object({
                    hearingDate: t.String(),
                    hearingTime: t.String(),
                    location: t.String(),
                    purpose: t.String(),
                    presidingOfficer: t.String(),
                    status: t.String(),
                    notes: t.String(),
                })
            ),
        }
    )

    // Delete hearing
    .delete("/hearings/:id", async ({ params, set }) => {
        const [deletedHearing] = await db
            .delete(hearings)
            .where(eq(hearings.id, parseInt(params.id)))
            .returning();

        if (!deletedHearing) {
            set.status = 404;
            return { success: false, message: "Hearing not found" };
        }

        return {
            success: true,
            message: "Hearing deleted successfully",
        };
    })

    // ✅ Get hearings for specific USER (only their filed cases)
    .get("/hearings/user/:userId", async ({ params }) => {
        const userId = parseInt(params.userId);

        // Get all reports filed by this user
        const { blotterReports } = await import("../db/schema");
        const userReports = await db.query.blotterReports.findMany({
            where: eq(blotterReports.filedById, userId),
        });

        const reportIds = userReports.map(r => r.id);

        if (reportIds.length === 0) {
            return {
                success: true,
                data: [],
            };
        }

        // Get hearings for these reports
        const { inArray } = await import("drizzle-orm");
        const userHearings = await db.query.hearings.findMany({
            where: inArray(hearings.blotterReportId, reportIds),
            orderBy: desc(hearings.createdAt),
        });

        // Join with report data to include case number
        const hearingsWithCaseInfo = await Promise.all(
            userHearings.map(async (hearing) => {
                const report = await db.query.blotterReports.findFirst({
                    where: eq(blotterReports.id, hearing.blotterReportId),
                });

                return {
                    ...hearing,
                    caseNumber: report?.caseNumber || "N/A",
                    incidentType: report?.incidentType || "N/A",
                };
            })
        );

        console.log(`📋 Found ${hearingsWithCaseInfo.length} hearings for user ${userId}`);

        return {
            success: true,
            data: hearingsWithCaseInfo,
        };
    })

    // ✅ Get hearings for specific OFFICER (only their assigned cases)
    .get("/hearings/officer/:officerId", async ({ params }) => {
        const officerId = parseInt(params.officerId);

        // Get all reports assigned to this officer
        const { blotterReports } = await import("../db/schema");
        const allReports = await db.query.blotterReports.findMany();

        // Filter reports where this officer is assigned
        const assignedReports = allReports.filter((report) => {
            if (!report.assignedOfficerIds) return false;

            const officerIds = report.assignedOfficerIds.split(",").map(id => parseInt(id.trim()));
            return officerIds.includes(officerId);
        });

        const reportIds = assignedReports.map(r => r.id);

        if (reportIds.length === 0) {
            return {
                success: true,
                data: [],
            };
        }

        // Get hearings for these reports
        const { inArray } = await import("drizzle-orm");
        const officerHearings = await db.query.hearings.findMany({
            where: inArray(hearings.blotterReportId, reportIds),
            orderBy: desc(hearings.createdAt),
        });

        // Join with report data to include case number
        const hearingsWithCaseInfo = await Promise.all(
            officerHearings.map(async (hearing) => {
                const report = await db.query.blotterReports.findFirst({
                    where: eq(blotterReports.id, hearing.blotterReportId),
                });

                return {
                    ...hearing,
                    caseNumber: report?.caseNumber || "N/A",
                    incidentType: report?.incidentType || "N/A",
                };
            })
        );

        console.log(`📋 Found ${hearingsWithCaseInfo.length} hearings for officer ${officerId}`);

        return {
            success: true,
            data: hearingsWithCaseInfo,
        };
    })

    // ==================== RESOLUTIONS ====================

    // Get all resolutions for a case
    .get("/resolutions/:reportId", async ({ params }) => {
        const reportId = parseInt(params.reportId);

        const resolutionsData = await db.query.resolutions.findMany({
            where: eq(resolutions.blotterReportId, reportId),
            orderBy: desc(resolutions.createdAt),
        });

        console.log(`📋 Found ${resolutionsData.length} resolutions for report ${reportId}`);

        return {
            success: true,
            data: resolutionsData,
        };
    })

    // Document resolution
    .post(
        "/resolutions",
        async ({ body }) => {
            const [newResolution] = await db
                .insert(resolutions)
                .values(body)
                .returning();

            console.log(`✅ Resolution documented for report ${newResolution.blotterReportId}`);

            return {
                success: true,
                data: newResolution,
            };
        },
        {
            body: t.Object({
                blotterReportId: t.Number(),
                resolutionType: t.String(),
                resolutionDetails: t.String(),
                resolvedDate: t.String(),
                resolvedBy: t.Optional(t.String()),
            }),
        }
    )

    // Update resolution
    .put(
        "/resolutions/:id",
        async ({ params, body, set }) => {
            const [updatedResolution] = await db
                .update(resolutions)
                .set(body)
                .where(eq(resolutions.id, parseInt(params.id)))
                .returning();

            if (!updatedResolution) {
                set.status = 404;
                return { success: false, message: "Resolution not found" };
            }

            return {
                success: true,
                data: updatedResolution,
            };
        },
        {
            body: t.Partial(
                t.Object({
                    resolutionType: t.String(),
                    resolutionDetails: t.String(),
                    resolvedDate: t.String(),
                    resolvedBy: t.String(),
                })
            ),
        }
    )

    // Delete resolution
    .delete("/resolutions/:id", async ({ params, set }) => {
        const [deletedResolution] = await db
            .delete(resolutions)
            .where(eq(resolutions.id, parseInt(params.id)))
            .returning();

        if (!deletedResolution) {
            set.status = 404;
            return { success: false, message: "Resolution not found" };
        }

        return {
            success: true,
            message: "Resolution deleted successfully",
        };
    });
