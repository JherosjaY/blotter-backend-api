import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const usersRoutes = new Elysia({ prefix: "/users" })
  // Get all users
  .get("/", async () => {
    const allUsers = await db.query.users.findMany({
      columns: {
        password: false, // Exclude password
      },
    });

    return {
      success: true,
      data: allUsers,
    };
  })

  // Get user by ID
  .get("/:id", async ({ params, set }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(params.id)),
      columns: {
        password: false,
      },
    });

    if (!user) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      data: user,
    };
  })

  // Update user
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const [updatedUser] = await db
        .update(users)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(users.id, parseInt(params.id)))
        .returning({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
        });

      if (!updatedUser) {
        set.status = 404;
        return { success: false, message: "User not found" };
      }

      return {
        success: true,
        data: updatedUser,
      };
    },
    {
      body: t.Partial(
        t.Object({
          firstName: t.String(),
          lastName: t.String(),
          isActive: t.Boolean(),
          profilePhotoUri: t.String(),
        })
      ),
    }
  )

  // Delete user
  .delete("/:id", async ({ params, set }) => {
    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, parseInt(params.id)))
      .returning();

    if (!deletedUser) {
      set.status = 404;
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      message: "User deleted successfully",
    };
  })

  // Save FCM token
  .post(
    "/fcm-token",
    async ({ body, set }) => {
      try {
        const { userId, fcmToken, deviceId } = body;

        // Update user's FCM token in database
        const [updatedUser] = await db
          .update(users)
          .set({
            fcmToken,
            deviceId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();

        if (!updatedUser) {
          set.status = 404;
          return { success: false, message: "User not found" };
        }

        console.log(`✅ FCM token saved for user ${userId}`);

        return {
          success: true,
          message: "FCM token saved successfully",
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to save FCM token",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        userId: t.Number(),
        fcmToken: t.String(),
        deviceId: t.Optional(t.String()),
      }),
    }
  );
