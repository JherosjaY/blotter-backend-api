import { Elysia, t } from "elysia";
import { db } from "../db";
import { respondents } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const respondentsRoutes = new Elysia({ prefix: "/respondents" })
  // Get all respondents
  .get("/", async () => {
    const allRespondents = await db.query.respondents.findMany({
      orderBy: desc(respondents.createdAt),
    });

    return {
      success: true,
      data: allRespondents,
    };
  })

  // Get respondents by report ID
  .get("/report/:reportId", async ({ params }) => {
    const reportRespondents = await db.query.respondents.findMany({
      where: eq(respondents.blotterReportId, parseInt(params.reportId)),
      orderBy: desc(respondents.createdAt),
    });

    return {
      success: true,
      data: reportRespondents,
    };
  })

  // Get respondent by ID
  .get("/:id", async ({ params, set }) => {
    const respondent = await db.query.respondents.findFirst({
      where: eq(respondents.id, parseInt(params.id)),
    });

    if (!respondent) {
      set.status = 404;
      return { success: false, message: "Respondent not found" };
    }

    return {
      success: true,
      data: respondent,
    };
  })

  // Create respondent
  .post(
    "/",
    async ({ body }) => {
      const [newRespondent] = await db
        .insert(respondents)
        .values({
          ...body,
          createdAt: new Date(),
        })
        .returning();

      return {
        success: true,
        message: "Respondent created successfully",
        data: newRespondent,
      };
    },
    {
      body: t.Object({
        blotterReportId: t.Number(),
        name: t.String(),
        age: t.Optional(t.Number()),
        address: t.Optional(t.String()),
        contactNumber: t.Optional(t.String()),
        cooperationStatus: t.Optional(t.String()),
      }),
    }
  )

  // Update respondent
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updatedRespondent] = await db
        .update(respondents)
        .set(body)
        .where(eq(respondents.id, parseInt(params.id)))
        .returning();

      if (!updatedRespondent) {
        set.status = 404;
        return { success: false, message: "Respondent not found" };
      }

      return {
        success: true,
        message: "Respondent updated successfully",
        data: updatedRespondent,
      };
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          age: t.Number(),
          address: t.String(),
          contactNumber: t.String(),
          cooperationStatus: t.String(),
        })
      ),
    }
  )

  // Delete respondent
  .delete("/:id", async ({ params, set }) => {
    const [deletedRespondent] = await db
      .delete(respondents)
      .where(eq(respondents.id, parseInt(params.id)))
      .returning();

    if (!deletedRespondent) {
      set.status = 404;
      return { success: false, message: "Respondent not found" };
    }

    return {
      success: true,
      message: "Respondent deleted successfully",
    };
  });
