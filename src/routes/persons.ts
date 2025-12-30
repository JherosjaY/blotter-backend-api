import { Elysia, t } from "elysia";
import { db } from "../db";
import { persons, personHistory } from "../db/schema";
import { eq, like, or, desc } from "drizzle-orm";

export const personsRoutes = new Elysia({ prefix: "/persons" })
  // Get all persons
  .get("/", async () => {
    const allPersons = await db.query.persons.findMany({
      orderBy: desc(persons.createdAt),
    });

    return {
      success: true,
      data: allPersons,
      count: allPersons.length,
    };
  })

  // Search persons
  .get("/search", async ({ query }) => {
    const searchQuery = query.q || "";
    
    const results = await db.query.persons.findMany({
      where: or(
        like(persons.firstName, `%${searchQuery}%`),
        like(persons.lastName, `%${searchQuery}%`),
        like(persons.contactNumber, `%${searchQuery}%`)
      ),
    });

    return {
      success: true,
      data: results,
      count: results.length,
    };
  })

  // Get person by ID
  .get("/:id", async ({ params, set }) => {
    const person = await db.query.persons.findFirst({
      where: eq(persons.id, parseInt(params.id)),
    });

    if (!person) {
      set.status = 404;
      return { success: false, message: "Person not found" };
    }

    return {
      success: true,
      data: person,
    };
  })

  // Get person history (all cases they're involved in)
  .get("/:id/history", async ({ params }) => {
    const history = await db.query.personHistory.findMany({
      where: eq(personHistory.personId, parseInt(params.id)),
      orderBy: desc(personHistory.createdAt),
    });

    return {
      success: true,
      data: history,
      count: history.length,
    };
  })

  // Create person
  .post(
    "/",
    async ({ body }) => {
      const [newPerson] = await db
        .insert(persons)
        .values({
          ...body,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        message: "Person created successfully",
        data: newPerson,
      };
    },
    {
      body: t.Object({
        firstName: t.String(),
        lastName: t.String(),
        middleName: t.Optional(t.String()),
        contactNumber: t.Optional(t.String()),
        address: t.Optional(t.String()),
        personType: t.String(), // Complainant, Witness, Suspect, Respondent
      }),
    }
  )

  // Update person
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updatedPerson] = await db
        .update(persons)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(persons.id, parseInt(params.id)))
        .returning();

      if (!updatedPerson) {
        set.status = 404;
        return { success: false, message: "Person not found" };
      }

      return {
        success: true,
        message: "Person updated successfully",
        data: updatedPerson,
      };
    },
    {
      body: t.Partial(
        t.Object({
          firstName: t.String(),
          lastName: t.String(),
          middleName: t.String(),
          contactNumber: t.String(),
          address: t.String(),
          personType: t.String(),
        })
      ),
    }
  )

  // Delete person
  .delete("/:id", async ({ params, set }) => {
    const [deletedPerson] = await db
      .delete(persons)
      .where(eq(persons.id, parseInt(params.id)))
      .returning();

    if (!deletedPerson) {
      set.status = 404;
      return { success: false, message: "Person not found" };
    }

    return {
      success: true,
      message: "Person deleted successfully",
    };
  });
