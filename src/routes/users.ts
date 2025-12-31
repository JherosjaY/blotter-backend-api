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
  )

  // Update user profile (first name, last name)
  .patch(
    "/:id/profile",
    async ({ params, body, set }) => {
      try {
        const userId = parseInt(params.id);
        const { firstName, lastName } = body;

        console.log(`📝 Updating profile for user ${userId}`);
        console.log(`  First Name: ${firstName}`);
        console.log(`  Last Name: ${lastName}`);

        // Update user in database
        const [updatedUser] = await db
          .update(users)
          .set({
            firstName,
            lastName,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            username: users.username,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            profilePhotoUri: users.profilePhotoUri,
          });

        if (!updatedUser) {
          set.status = 404;
          return { success: false, message: "User not found" };
        }

        console.log(`✅ Profile updated successfully`);

        return {
          success: true,
          message: "Profile updated successfully",
          data: updatedUser,
        };
      } catch (error) {
        console.error("❌ Error updating profile:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to update profile",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        firstName: t.String(),
        lastName: t.String(),
      }),
    }
  )

  // Change user password
  .patch(
    "/:id/password",
    async ({ params, body, set }) => {
      try {
        const userId = parseInt(params.id);
        const { currentPassword, newPassword } = body;

        console.log(`🔐 Changing password for user ${userId}`);

        // Get user with password
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!user) {
          set.status = 404;
          return { success: false, message: "User not found" };
        }

        // Verify current password
        const bcrypt = require("bcrypt");
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
          set.status = 401;
          return { success: false, message: "Current password is incorrect" };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        console.log(`✅ Password changed successfully`);

        return {
          success: true,
          message: "Password changed successfully",
        };
      } catch (error) {
        console.error("❌ Error changing password:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to change password",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        currentPassword: t.String(),
        newPassword: t.String(),
      }),
    }
  );
