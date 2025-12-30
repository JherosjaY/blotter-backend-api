import { Elysia } from "elysia";
import { db } from "../db";
import { blotterReports, users, officers } from "../db/schema";
import { eq, count, and } from "drizzle-orm";

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  // Get dashboard analytics
  .get("/analytics", async () => {
    try {
      // Count total reports
      const totalReportsResult = await db
        .select({ count: count() })
        .from(blotterReports)
        .where(eq(blotterReports.isArchived, false));
      
      const totalReports = totalReportsResult[0]?.count || 0;

      // Count by status
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

      const ongoingResult = await db
        .select({ count: count() })
        .from(blotterReports)
        .where(
          and(
            eq(blotterReports.status, "Under Investigation"),
            eq(blotterReports.isArchived, false)
          )
        );
      
      const ongoingReports = ongoingResult[0]?.count || 0;

      const resolvedResult = await db
        .select({ count: count() })
        .from(blotterReports)
        .where(
          and(
            eq(blotterReports.status, "Resolved"),
            eq(blotterReports.isArchived, false)
          )
        );
      
      const resolvedReports = resolvedResult[0]?.count || 0;

      const archivedResult = await db
        .select({ count: count() })
        .from(blotterReports)
        .where(eq(blotterReports.isArchived, true));
      
      const archivedReports = archivedResult[0]?.count || 0;

      // Count officers (from users table with Officer role)
      const officersResult = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            eq(users.isActive, true),
            eq(users.role, "Officer")
          )
        );
      
      const totalOfficers = officersResult[0]?.count || 0;

      // Count users (exclude Admin and Officer roles)
      const usersResult = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            eq(users.isActive, true),
            // Exclude Admin and Officer from user count
            // Only count regular users
            eq(users.role, "User")
          )
        );
      
      const totalUsers = usersResult[0]?.count || 0;

      return {
        success: true,
        data: {
          totalReports,
          pendingReports,
          ongoingReports,
          resolvedReports,
          archivedReports,
          totalOfficers,
          totalUsers,
        },
      };
    } catch (error) {
      console.error("Dashboard analytics error:", error);
      return {
        success: false,
        message: "Failed to fetch dashboard analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
