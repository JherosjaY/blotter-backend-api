import { Elysia, t } from "elysia";
import { db } from "../db";
import { hearings, blotterReports } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import FCM from "../../backend-fcm-helper.js";

export const hearingsRoutes = new Elysia({ prefix: "/hearings" })
  // Get all hearings
  .get("/", async () => {
    const allHearings = await db.query.hearings.findMany({
      orderBy: desc(hearings.createdAt),
    });

    return {
      success: true,
      data: allHearings,
      count: allHearings.length,
    };
  })

  // Get hearings by report ID
  .get("/report/:reportId", async ({ params }) => {
    const reportHearings = await db.query.hearings.findMany({
      where: eq(hearings.blotterReportId, parseInt(params.reportId)),
      orderBy: desc(hearings.hearingDate),
    });

    return {
      success: true,
      data: reportHearings,
      count: reportHearings.length,
    };
  })

  // Get hearing by ID
  .get("/:id", async ({ params, set }) => {
    const hearing = await db.query.hearings.findFirst({
      where: eq(hearings.id, parseInt(params.id)),
    });

    if (!hearing) {
      set.status = 404;
      return { success: false, message: "Hearing not found" };
    }

    return {
      success: true,
      data: hearing,
    };
  })

  // Create hearing
  .post(
    "/",
    async ({ body }) => {
      const [newHearing] = await db
        .insert(hearings)
        .values({
          ...body,
          createdAt: new Date(),
        })
        .returning();

      // Send notification about hearing scheduled
      try {
        const report = await db.query.blotterReports.findFirst({
          where: eq(blotterReports.id, body.blotterReportId),
        });

        if (report) {
          // Notify complainant
          if (report.filedById) {
            await FCM.notifyUserHearingScheduled(
              db,
              report.filedById,
              report.caseNumber,
              body.hearingDate,
              body.location,
              body.hearingTime
            );
          }

          // Notify assigned officer
          if (report.assignedOfficerIds) {
            const officerIds = report.assignedOfficerIds.split(',').map(id => parseInt(id.trim()));
            for (const officerId of officerIds) {
              await FCM.notifyOfficerHearingScheduled(
                db,
                officerId,
                report.caseNumber,
                body.hearingDate,
                body.location
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      return {
        success: true,
        message: "Hearing created successfully",
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
        status: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    }
  )

  // Update hearing
  .put(
    "/:id",
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
        message: "Hearing updated successfully",
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
          status: t.String(),
          notes: t.String(),
        })
      ),
    }
  )

  // Delete hearing
  .delete("/:id", async ({ params, set }) => {
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
  });
