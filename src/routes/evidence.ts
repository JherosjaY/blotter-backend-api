import { Elysia, t } from "elysia";
import { db } from "../db";
import { evidence } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const evidenceRoutes = new Elysia({ prefix: "/evidence" })
  // Get all evidence
  .get("/", async () => {
    const allEvidence = await db.query.evidence.findMany({
      orderBy: desc(evidence.createdAt),
    });

    return {
      success: true,
      data: allEvidence,
      count: allEvidence.length,
    };
  })

  // Get evidence by report ID
  .get("/report/:reportId", async ({ params }) => {
    const reportEvidence = await db.query.evidence.findMany({
      where: eq(evidence.blotterReportId, parseInt(params.reportId)),
      orderBy: desc(evidence.createdAt),
    });

    return {
      success: true,
      data: reportEvidence,
      count: reportEvidence.length,
    };
  })

  // Get evidence by ID
  .get("/:id", async ({ params, set }) => {
    const evidenceItem = await db.query.evidence.findFirst({
      where: eq(evidence.id, parseInt(params.id)),
    });

    if (!evidenceItem) {
      set.status = 404;
      return { success: false, message: "Evidence not found" };
    }

    return {
      success: true,
      data: evidenceItem,
    };
  })

  // Create evidence
  .post(
    "/",
    async ({ body }) => {
      const [newEvidence] = await db
        .insert(evidence)
        .values({
          ...body,
          createdAt: new Date(),
        })
        .returning();

      return {
        success: true,
        message: "Evidence created successfully",
        data: newEvidence,
      };
    },
    {
      body: t.Object({
        blotterReportId: t.Number(),
        evidenceType: t.String(),
        description: t.String(),
        locationFound: t.Optional(t.String()),
        photoUri: t.Optional(t.String()),
        collectedBy: t.Optional(t.String()),
      }),
    }
  )

  // Update evidence
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updatedEvidence] = await db
        .update(evidence)
        .set(body)
        .where(eq(evidence.id, parseInt(params.id)))
        .returning();

      if (!updatedEvidence) {
        set.status = 404;
        return { success: false, message: "Evidence not found" };
      }

      return {
        success: true,
        message: "Evidence updated successfully",
        data: updatedEvidence,
      };
    },
    {
      body: t.Partial(
        t.Object({
          evidenceType: t.String(),
          description: t.String(),
          locationFound: t.String(),
          photoUri: t.String(),
          collectedBy: t.String(),
        })
      ),
    }
  )

  // Delete evidence
  .delete("/:id", async ({ params, set }) => {
    const [deletedEvidence] = await db
      .delete(evidence)
      .where(eq(evidence.id, parseInt(params.id)))
      .returning();

    if (!deletedEvidence) {
      set.status = 404;
      return { success: false, message: "Evidence not found" };
    }

    return {
      success: true,
      message: "Evidence deleted successfully",
    };
  });
