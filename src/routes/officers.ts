import { Elysia, t } from "elysia";
import { db } from "../db";
import { officers } from "../db/schema";
import { eq } from "drizzle-orm";

export const officersRoutes = new Elysia({ prefix: "/officers" })
  // Get all officers
  .get("/", async () => {
    const allOfficers = await db.query.officers.findMany();

    return {
      success: true,
      data: allOfficers,
    };
  })

  // Get officer by ID
  .get("/:id", async ({ params, set }) => {
    const officer = await db.query.officers.findFirst({
      where: eq(officers.id, parseInt(params.id)),
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

  // Create officer
  .post(
    "/",
    async ({ body }) => {
      const [newOfficer] = await db.insert(officers).values(body).returning();

      return {
        success: true,
        data: newOfficer,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        badgeNumber: t.String(),
        rank: t.Optional(t.String()),
        contactNumber: t.Optional(t.String()),
        email: t.Optional(t.String()),
        userId: t.Optional(t.Number()),
      }),
    }
  )

  // Update officer
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updatedOfficer] = await db
        .update(officers)
        .set(body)
        .where(eq(officers.id, parseInt(params.id)))
        .returning();

      if (!updatedOfficer) {
        set.status = 404;
        return { success: false, message: "Officer not found" };
      }

      return {
        success: true,
        data: updatedOfficer,
      };
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String(),
          rank: t.String(),
          contactNumber: t.String(),
          email: t.String(),
          isActive: t.Boolean(),
        })
      ),
    }
  )

  // Delete officer
  .delete("/:id", async ({ params, set }) => {
    const [deletedOfficer] = await db
      .delete(officers)
      .where(eq(officers.id, parseInt(params.id)))
      .returning();

    if (!deletedOfficer) {
      set.status = 404;
      return { success: false, message: "Officer not found" };
    }

    return {
      success: true,
      message: "Officer deleted successfully",
    };
  });
