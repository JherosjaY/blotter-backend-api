import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import FCM from "../backend-fcm-helper.js";
import { setupAdmin } from "./db/setup-admin";

// Initialize Firebase Cloud Messaging
FCM.initializeFCM();

// Setup admin account (auto-creates if doesn't exist)
setupAdmin().catch(console.error);

// Import routes
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { adminOfficerRoutes } from "./routes/admin-officers";
import { officerRoutes } from "./routes/officer";
import { reportsRoutes } from "./routes/reports";
import { usersRoutes } from "./routes/users";
import { officersRoutes } from "./routes/officers";
import { witnessesRoutes } from "./routes/witnesses";
import { suspectsRoutes } from "./routes/suspects";
import { dashboardRoutes } from "./routes/dashboard";
import { personsRoutes } from "./routes/persons";
import { evidenceRoutes } from "./routes/evidence";
import { hearingsRoutes } from "./routes/hearings";
import { resolutionsRoutes } from "./routes/resolutions";
import { activityLogsRoutes } from "./routes/activityLogs";
import { notificationsRoutes } from "./routes/notifications";
import { respondentsRoutes } from "./routes/respondents";
import { uploadRoutes } from "./routes/upload";
import { investigationRoutes } from "./routes/investigation";
import { smsRoutes } from "./routes/sms";

export const app = new Elysia()
  .use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    })
  )
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Blotter Management System API",
          version: "1.0.0",
          description: "API for Blotter Management System",
        },
      },
    })
  )
  // Health check
  .get("/", () => ({
    success: true,
    message: "Blotter API is running!",
    timestamp: new Date().toISOString(),
    endpoints: {
      swagger: "/swagger",
      auth: "/api/auth",
      admin: "/api/admin",
      reports: "/api/reports",
      users: "/api/users",
      officers: "/api/officers",
      witnesses: "/api/witnesses",
      suspects: "/api/suspects",
      dashboard: "/api/dashboard",
      persons: "/api/persons",
      evidence: "/api/evidence",
      hearings: "/api/hearings",
      resolutions: "/api/resolutions",
      activityLogs: "/api/activity-logs",
      notifications: "/api/notifications",
      respondents: "/api/respondents",
    },
  }))
  .get("/health", () => ({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  }))
  // Mount routes
  .group("/api", (app) =>
    app
      .use(authRoutes)
      .use(adminRoutes)
      .use(adminOfficerRoutes)
      .use(officerRoutes)
      .use(reportsRoutes)
      .use(usersRoutes)
      .use(officersRoutes)
      .use(witnessesRoutes)
      .use(suspectsRoutes)
      .use(dashboardRoutes)
      .use(personsRoutes)
      .use(evidenceRoutes)
      .use(hearingsRoutes)
      .use(resolutionsRoutes)
      .use(activityLogsRoutes)
      .use(notificationsRoutes)
      .use(respondentsRoutes)
      .use(uploadRoutes)
      .use(investigationRoutes)
      .use(smsRoutes)
  )
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type ElysiaApp = typeof app;
