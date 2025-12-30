import { Elysia, t } from "elysia";
import { db } from "../db";
import { witnesses } from "../db/schema";
import { eq } from "drizzle-orm";

export const witnessesRoutes = new Elysia({ prefix: "/witnesses" })
  // Get witnesses by report ID
  .get("/report/:reportId", async ({ params }) => {
    const reportWitnesses = await db.query.witnesses.findMany({
      where: eq(witnesses.blotterReportId, parseInt(params.reportId)),
    });

    return {
      success: true,
      data: reportWitnesses,
    };
  })

  // Create witness
  .post(
    "/",
    async ({ body }) => {
      const [newWitness] = await db.insert(witnesses).values(body).returning();

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

  // Delete witness
  .delete("/:id", async ({ params, set }) => {
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
  });
