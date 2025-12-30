import { Elysia, t } from "elysia";
import { db } from "../db";
import { blotterReports, notifications, users } from "../db/schema";
import { eq } from "drizzle-orm";
import admin from "firebase-admin";

export const notificationsRoutes = new Elysia({ prefix: "/notifications" })
  // Send Email Notification
  .post(
    "/email",
    async ({ body }) => {
      try {
        const { reportId, recipientEmail, notificationType, oldStatus, newStatus } = body;

        // Get report details
        const [report] = await db
          .select()
          .from(blotterReports)
          .where(eq(blotterReports.id, reportId))
          .limit(1);

        if (!report) {
          return {
            success: false,
            message: "Report not found",
          };
        }

        // Create notification record
        await db.insert(notifications).values({
          userId: report.filedById || 0,
          title: getNotificationTitle(notificationType),
          message: getNotificationMessage(notificationType, report, oldStatus, newStatus),
          type: "email",
          caseId: reportId,
          isRead: false,
        });

        console.log(`Email notification sent to ${recipientEmail}`);
        console.log(`Type: ${notificationType}`);
        console.log(`Report: ${report.caseNumber}`);

        return {
          success: true,
          message: "Email notification sent successfully",
          data: {
            recipientEmail,
            notificationType,
            caseNumber: report.caseNumber,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          message: "Failed to send email notification",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        reportId: t.Number(),
        recipientEmail: t.String(),
        notificationType: t.String(),
        oldStatus: t.Optional(t.String()),
        newStatus: t.Optional(t.String()),
      }),
    }
  )

  // Send Push Notification
  .post(
    "/push",
    async ({ body }) => {
      try {
        const { userId, reportId, notificationType, title, message } = body;

        // Create notification record
        await db.insert(notifications).values({
          userId,
          title,
          message,
          type: "push",
          caseId: reportId,
          isRead: false,
        });

        console.log(`Push notification sent to user ${userId}`);
        console.log(`Title: ${title}`);
        console.log(`Message: ${message}`);

        return {
          success: true,
          message: "Push notification sent successfully",
          data: {
            userId,
            notificationType,
            title,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          message: "Failed to send push notification",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        userId: t.Number(),
        reportId: t.Number(),
        notificationType: t.String(),
        title: t.String(),
        message: t.String(),
      }),
    }
  )

  // Get User Notifications
  .get("/user/:userId", async ({ params }) => {
    try {
      const userId = parseInt(params.userId);

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(notifications.timestamp);

      return {
        success: true,
        notifications: userNotifications,
        count: userNotifications.length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get notifications",
        error: error.message,
      };
    }
  })

  // Mark Notification as Read
  .patch("/read/:notificationId", async ({ params }) => {
    try {
      const notificationId = parseInt(params.notificationId);

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));

      return {
        success: true,
        message: "Notification marked as read",
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to mark notification as read",
        error: error.message,
      };
    }
  })

  // Mark All Notifications as Read for a User
  .patch("/read-all/:userId", async ({ params }) => {
    try {
      const userId = parseInt(params.userId);

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, userId));

      return {
        success: true,
        message: "All notifications marked as read",
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to mark all notifications as read",
        error: error.message,
      };
    }
  })

  // Upload Audio Recording
  .post("/audio/:reportId", async ({ params, body }) => {
    try {
      const reportId = parseInt(params.reportId);

      // In a real implementation, you would:
      // 1. Handle file upload with multipart/form-data
      // 2. Upload to cloud storage (AWS S3, Google Cloud Storage)
      // 3. Get the public URL

      // For now, simulate audio URI
      const audioUri = `https://storage.blotter.com/audio/report_${reportId}_${Date.now()}.m4a`;

      // Update report with audio URI
      await db
        .update(blotterReports)
        .set({
          audioRecordingUri: audioUri,
          updatedAt: new Date(),
        })
        .where(eq(blotterReports.id, reportId));

      return {
        success: true,
        audioUri,
        message: "Audio uploaded successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to upload audio",
        error: error.message,
      };
    }
  })

  // Get Audio Recording
  .get("/audio/:reportId", async ({ params }) => {
    try {
      const reportId = parseInt(params.reportId);

      const [report] = await db
        .select()
        .from(blotterReports)
        .where(eq(blotterReports.id, reportId))
        .limit(1);

      if (!report || !report.audioRecordingUri) {
        return {
          success: false,
          message: "Audio recording not found",
        };
      }

      return {
        success: true,
        audioUri: report.audioRecordingUri,
        caseNumber: report.caseNumber,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get audio recording",
        error: error.message,
      };
    }
  })

  // Get Connected Devices (users with FCM tokens)
  .get("/devices", async () => {
    try {
      const connectedUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          role: users.role,
          fcmToken: users.fcmToken,
          deviceId: users.deviceId,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.isActive, true));

      // Filter users with FCM tokens
      const devicesWithTokens = connectedUsers.filter(user => user.fcmToken);

      return {
        success: true,
        devices: devicesWithTokens,
        count: devicesWithTokens.length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to get connected devices",
        error: error.message,
      };
    }
  })

  // Send FCM Notification to specific user
  .post(
    "/fcm/send",
    async ({ body, set }) => {
      try {
        const { userId, title, message } = body;

        // Get user's FCM token
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!user || !user.fcmToken) {
          set.status = 404;
          return {
            success: false,
            message: "User or FCM token not found",
          };
        }

        // Send FCM notification
        const fcmMessage = {
          notification: {
            title: title,
            body: message,
          },
          token: user.fcmToken,
        };

        const response = await admin.messaging().send(fcmMessage);

        console.log(`✅ FCM notification sent to ${user.firstName} ${user.lastName}`);
        console.log(`Response: ${response}`);

        return {
          success: true,
          message: "Notification sent successfully",
          data: {
            userId,
            userName: `${user.firstName} ${user.lastName}`,
            messageId: response,
          },
        };
      } catch (error: any) {
        console.error("❌ FCM send error:", error);
        set.status = 500;
        return {
          success: false,
          message: "Failed to send notification",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        userId: t.Number(),
        title: t.String(),
        message: t.String(),
      }),
    }
  )

  // Send FCM Notification to all users
  .post(
    "/fcm/send-all",
    async ({ body, set }) => {
      try {
        const { title, message } = body;

        // Get all users with FCM tokens
        const usersWithTokens = await db
          .select()
          .from(users)
          .where(eq(users.isActive, true));

        const tokens = usersWithTokens
          .filter(user => user.fcmToken)
          .map(user => user.fcmToken as string);

        if (tokens.length === 0) {
          return {
            success: false,
            message: "No devices with FCM tokens found",
          };
        }

        // Send to multiple devices
        const fcmMessage = {
          notification: {
            title: title,
            body: message,
          },
          tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(fcmMessage);

        console.log(`✅ FCM notification sent to ${response.successCount} devices`);
        console.log(`❌ Failed: ${response.failureCount}`);

        return {
          success: true,
          message: "Notifications sent",
          data: {
            successCount: response.successCount,
            failureCount: response.failureCount,
            totalDevices: tokens.length,
          },
        };
      } catch (error: any) {
        console.error("❌ FCM send-all error:", error);
        set.status = 500;
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

  // Send FCM Notification to bulk users (manual notification)
  .post(
    "/fcm/send-bulk",
    async ({ body, set }) => {
      try {
        const { title, message, recipientType, specificUserIds } = body;

        // Get users based on recipient type
        let targetUsers;
        
        if (recipientType === "Specific Users" && specificUserIds && specificUserIds.length > 0) {
          // Get specific users
          targetUsers = await db
            .select()
            .from(users)
            .where(eq(users.isActive, true));
          targetUsers = targetUsers.filter(user => specificUserIds.includes(user.id));
        } else {
          // Get all active users
          targetUsers = await db
            .select()
            .from(users)
            .where(eq(users.isActive, true));
          
          // Filter by role
          if (recipientType === "All Users") {
            targetUsers = targetUsers.filter(user => user.role === "User");
          } else if (recipientType === "All Admins") {
            targetUsers = targetUsers.filter(user => user.role === "Admin");
          } else if (recipientType === "All Officers") {
            targetUsers = targetUsers.filter(user => user.role === "Officer");
          }
        }

        const tokens = targetUsers
          .filter(user => user.fcmToken)
          .map(user => user.fcmToken as string);

        if (tokens.length === 0) {
          return {
            success: true,
            message: "No devices with FCM tokens found, but in-app notifications were created",
            data: {
              successCount: 0,
              failureCount: 0,
              totalDevices: 0,
            },
          };
        }

        // Send to multiple devices
        const fcmMessage = {
          notification: {
            title: title,
            body: message,
          },
          data: {
            type: "ANNOUNCEMENT",
            timestamp: new Date().toISOString(),
          },
          tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(fcmMessage);

        console.log(`✅ FCM bulk notification sent to ${response.successCount} devices`);
        console.log(`❌ Failed: ${response.failureCount}`);
        console.log(`📋 Recipient type: ${recipientType}`);

        return {
          success: true,
          message: "Notifications sent successfully",
          data: {
            successCount: response.successCount,
            failureCount: response.failureCount,
            totalDevices: tokens.length,
            recipientType,
          },
        };
      } catch (error: any) {
        console.error("❌ FCM send-bulk error:", error);
        set.status = 500;
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
        recipientType: t.String(),
        specificUserIds: t.Optional(t.Array(t.Number())),
      }),
    }
  );

// Helper functions
function getNotificationTitle(type: string): string {
  switch (type) {
    case "report_filed":
      return "Report Filed Successfully";
    case "status_update":
      return "Status Updated";
    case "case_assigned":
      return "Case Assigned";
    case "hearing_scheduled":
      return "Hearing Scheduled";
    default:
      return "Notification";
  }
}

function getNotificationMessage(
  type: string,
  report: any,
  oldStatus?: string,
  newStatus?: string
): string {
  switch (type) {
    case "report_filed":
      return `Your blotter report ${report.caseNumber} has been filed successfully.`;
    case "status_update":
      return `Case ${report.caseNumber} status changed from ${oldStatus} to ${newStatus}.`;
    case "case_assigned":
      return `Case ${report.caseNumber} has been assigned to an officer.`;
    case "hearing_scheduled":
      return `A hearing has been scheduled for case ${report.caseNumber}.`;
    default:
      return "You have a new notification.";
  }
}
