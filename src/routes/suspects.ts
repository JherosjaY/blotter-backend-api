import { Elysia, t } from "elysia";
import { db } from "../db";
import { suspects } from "../db/schema";
import { eq } from "drizzle-orm";

export const suspectsRoutes = new Elysia({ prefix: "/suspects" })
  // Get suspects by report ID
  .get("/report/:reportId", async ({ params }) => {
    const reportSuspects = await db.query.suspects.findMany({
      where: eq(suspects.blotterReportId, parseInt(params.reportId)),
    });

    return {
      success: true,
      data: reportSuspects,
    };
  })

  // Create suspect
  .post(
    "/",
    async ({ body }) => {
      const [newSuspect] = await db.insert(suspects).values(body).returning();

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

  // Delete suspect
  .delete("/:id", async ({ params, set }) => {
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
  });
