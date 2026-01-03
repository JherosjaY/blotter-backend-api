import { Elysia, t } from "elysia";
import { db } from "../db";
import { notifications, users, officers } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import FCM from "../../backend-fcm-helper.js";

export const notificationsRoutes = new Elysia({ prefix: "/notifications" })

  // ✅ Send notification to all users
  .post(
    "/send-to-all-users",
    async ({ body }) => {
      const { title, message } = body;

      try {
        // Get all active users (exclude admins and officers)
        const allUsers = await db.query.users.findMany({
          where: (users, { eq }) => eq(users.isActive, true),
        });

        if (allUsers.length === 0) {
          return {
            success: false,
            message: "No active users found",
          };
        }

        // Create notifications for all users
        const notificationPromises = allUsers.map(async (user) => {
          // Insert into database
          await db.insert(notifications).values({
            userId: user.id,
            title,
            message,
            type: "ANNOUNCEMENT",
            isRead: false,
          });

          // Send FCM push notification
          if (user.fcmToken) {
            try {
              await FCM.sendPushNotification(user.fcmToken, title, message, {
                type: "ANNOUNCEMENT",
              });
            } catch (error) {
              console.error(`Failed to send FCM to user ${user.id}:`, error);
            }
          }
        });

        await Promise.all(notificationPromises);

        console.log(`✅ Sent notification to ${allUsers.length} users`);

        return {
          success: true,
          message: `Notification sent to ${allUsers.length} user(s)`,
          data: {
            recipientCount: allUsers.length,
          },
        };
      } catch (error: any) {
        console.error("Error sending notifications:", error);
        return {
          success: false,
          message: "Failed to send notifications",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        message: t.String(),
      }),
    }
  )

  // ✅ Send notification to specific users
  .post(
    "/send-to-specific-users",
    async ({ body }) => {
      const { title, message, userIds } = body;

      try {
        if (userIds.length === 0) {
          return {
            success: false,
            message: "No users selected",
          };
        }

        // Get selected users
        const selectedUsers = await db.query.users.findMany({
          where: (users, { inArray }) => inArray(users.id, userIds),
        });

        if (selectedUsers.length === 0) {
          return {
            success: false,
            message: "No valid users found",
          };
        }

        // Create notifications for selected users
        const notificationPromises = selectedUsers.map(async (user) => {
          // Insert into database
          await db.insert(notifications).values({
            userId: user.id,
            title,
            message,
            type: "ANNOUNCEMENT",
            isRead: false,
          });

          // Send FCM push notification
          if (user.fcmToken) {
            try {
              await FCM.sendPushNotification(user.fcmToken, title, message, {
                type: "ANNOUNCEMENT",
              });
            } catch (error) {
              console.error(`Failed to send FCM to user ${user.id}:`, error);
            }
          }
        });

        await Promise.all(notificationPromises);

        console.log(`✅ Sent notification to ${selectedUsers.length} specific users`);

        return {
          success: true,
          message: `Notification sent to ${selectedUsers.length} user(s)`,
          data: {
            recipientCount: selectedUsers.length,
          },
        };
      } catch (error: any) {
        console.error("Error sending notifications:", error);
        return {
          success: false,
          message: "Failed to send notifications",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        message: t.String(),
        userIds: t.Array(t.Number()),
      }),
    }
  )

  // ✅ Send notification to all officers
  .post(
    "/send-to-all-officers",
    async ({ body }) => {
      const { title, message } = body;

      try {
        // Get all active officers
        const allOfficers = await db.query.officers.findMany({
          where: (officers, { eq }) => eq(officers.isActive, true),
        });

        if (allOfficers.length === 0) {
          return {
            success: false,
            message: "No active officers found",
          };
        }

        // Get user IDs for officers
        const userIds = allOfficers
          .map((officer) => officer.userId)
          .filter((id) => id !== null) as number[];

        if (userIds.length === 0) {
          return {
            success: false,
            message: "No officer user accounts found",
          };
        }

        // Get users for officers
        const officerUsers = await db.query.users.findMany({
          where: (users, { inArray }) => inArray(users.id, userIds),
        });

        // Create notifications for all officers
        const notificationPromises = officerUsers.map(async (user) => {
          // Insert into database
          await db.insert(notifications).values({
            userId: user.id,
            title,
            message,
            type: "ANNOUNCEMENT",
            isRead: false,
          });

          // Send FCM push notification
          if (user.fcmToken) {
            try {
              await FCM.sendPushNotification(user.fcmToken, title, message, {
                type: "ANNOUNCEMENT",
              });
            } catch (error) {
              console.error(`Failed to send FCM to officer ${user.id}:`, error);
            }
          }
        });

        await Promise.all(notificationPromises);

        console.log(`✅ Sent notification to ${officerUsers.length} officers`);

        return {
          success: true,
          message: `Notification sent to ${officerUsers.length} officer(s)`,
          data: {
            recipientCount: officerUsers.length,
          },
        };
      } catch (error: any) {
        console.error("Error sending notifications:", error);
        return {
          success: false,
          message: "Failed to send notifications",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        message: t.String(),
      }),
    }
  )

  // ✅ Send notification to specific officers
  .post(
    "/send-to-specific-officers",
    async ({ body }) => {
      const { title, message, officerIds } = body;

      try {
        if (officerIds.length === 0) {
          return {
            success: false,
            message: "No officers selected",
          };
        }

        // Get selected officers
        const selectedOfficers = await db.query.officers.findMany({
          where: (officers, { inArray }) => inArray(officers.id, officerIds),
        });

        if (selectedOfficers.length === 0) {
          return {
            success: false,
            message: "No valid officers found",
          };
        }

        // Get user IDs for officers
        const userIds = selectedOfficers
          .map((officer) => officer.userId)
          .filter((id) => id !== null) as number[];

        if (userIds.length === 0) {
          return {
            success: false,
            message: "No officer user accounts found",
          };
        }

        // Get users for officers
        const officerUsers = await db.query.users.findMany({
          where: (users, { inArray }) => inArray(users.id, userIds),
        });

        // Create notifications for selected officers
        const notificationPromises = officerUsers.map(async (user) => {
          // Insert into database
          await db.insert(notifications).values({
            userId: user.id,
            title,
            message,
            type: "ANNOUNCEMENT",
            isRead: false,
          });

          // Send FCM push notification
          if (user.fcmToken) {
            try {
              await FCM.sendPushNotification(user.fcmToken, title, message, {
                type: "ANNOUNCEMENT",
              });
            } catch (error) {
              console.error(`Failed to send FCM to officer ${user.id}:`, error);
            }
          }
        });

        await Promise.all(notificationPromises);

        console.log(`✅ Sent notification to ${officerUsers.length} specific officers`);

        return {
          success: true,
          message: `Notification sent to ${officerUsers.length} officer(s)`,
          data: {
            recipientCount: officerUsers.length,
          },
        };
      } catch (error: any) {
        console.error("Error sending notifications:", error);
        return {
          success: false,
          message: "Failed to send notifications",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        message: t.String(),
        officerIds: t.Array(t.Number()),
      }),
    }
  )

  // ✅ Get all users (for selection dialog)
  .get("/users", async () => {
    const allUsers = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.isActive, true),
    });

    return {
      success: true,
      data: allUsers,
    };
  })

  // ✅ Get all officers (for selection dialog)
  .get("/officers", async () => {
    const allOfficers = await db.query.officers.findMany({
      where: (officers, { eq }) => eq(officers.isActive, true),
    });

    return {
      success: true,
      data: allOfficers,
    };
  });
