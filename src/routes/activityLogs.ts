import { Elysia, t } from "elysia";
import { db } from "../db";
import { activityLogs } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const activityLogsRoutes = new Elysia({ prefix: "/activity-logs" })
  // Get all activity logs
  .get("/", async ({ query }) => {
    const limit = query.limit ? parseInt(query.limit as string) : 100;
    
    const logs = await db.query.activityLogs.findMany({
      orderBy: desc(activityLogs.timestamp),
      limit,
    });

    return {
      success: true,
      data: logs,
      count: logs.length,
    };
  })

  // Get activity logs by case ID
  .get("/case/:caseId", async ({ params }) => {
    const caseLogs = await db.query.activityLogs.findMany({
      where: eq(activityLogs.caseId, parseInt(params.caseId)),
      orderBy: desc(activityLogs.timestamp),
    });

    return {
      success: true,
      data: caseLogs,
      count: caseLogs.length,
    };
  })

  // Get activity log by ID
  .get("/:id", async ({ params, set }) => {
    const log = await db.query.activityLogs.findFirst({
      where: eq(activityLogs.id, parseInt(params.id)),
    });

    if (!log) {
      set.status = 404;
      return { success: false, message: "Activity log not found" };
    }

    return {
      success: true,
      data: log,
    };
  })

  // Create activity log
  .post(
    "/",
    async ({ body }) => {
      const [newLog] = await db
        .insert(activityLogs)
        .values({
          ...body,
          timestamp: new Date(),
        })
        .returning();

      return {
        success: true,
        message: "Activity log created successfully",
        data: newLog,
      };
    },
    {
      body: t.Object({
        caseId: t.Optional(t.Number()),
        caseTitle: t.Optional(t.String()),
        activityType: t.String(),
        description: t.String(),
        oldValue: t.Optional(t.String()),
        newValue: t.Optional(t.String()),
        performedBy: t.String(),
      }),
    }
  )

  // Delete activity log
  .delete("/:id", async ({ params, set }) => {
    const [deletedLog] = await db
      .delete(activityLogs)
      .where(eq(activityLogs.id, parseInt(params.id)))
      .returning();

    if (!deletedLog) {
      set.status = 404;
      return { success: false, message: "Activity log not found" };
    }

    return {
      success: true,
      message: "Activity log deleted successfully",
    };
  });
