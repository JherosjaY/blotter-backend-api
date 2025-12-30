import { Elysia, t } from "elysia";
import { db } from "../db";
import { resolutions } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const resolutionsRoutes = new Elysia({ prefix: "/resolutions" })
  // Get all resolutions
  .get("/", async () => {
    const allResolutions = await db.query.resolutions.findMany({
      orderBy: desc(resolutions.createdAt),
    });

    return {
      success: true,
      data: allResolutions,
      count: allResolutions.length,
    };
  })

  // Get resolutions by report ID
  .get("/report/:reportId", async ({ params }) => {
    const reportResolutions = await db.query.resolutions.findMany({
      where: eq(resolutions.blotterReportId, parseInt(params.reportId)),
      orderBy: desc(resolutions.createdAt),
    });

    return {
      success: true,
      data: reportResolutions,
      count: reportResolutions.length,
    };
  })

  // Get resolution by ID
  .get("/:id", async ({ params, set }) => {
    const resolution = await db.query.resolutions.findFirst({
      where: eq(resolutions.id, parseInt(params.id)),
    });

    if (!resolution) {
      set.status = 404;
      return { success: false, message: "Resolution not found" };
    }

    return {
      success: true,
      data: resolution,
    };
  })

  // Create resolution
  .post(
    "/",
    async ({ body }) => {
      const [newResolution] = await db
        .insert(resolutions)
        .values({
          ...body,
          createdAt: new Date(),
        })
        .returning();

      return {
        success: true,
        message: "Resolution created successfully",
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
    "/:id",
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
        message: "Resolution updated successfully",
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
  .delete("/:id", async ({ params, set }) => {
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
