import { Elysia, t } from "elysia";
import { db } from "../db";
import { blotterReports } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import FCM from "../../backend-fcm-helper.js";

export const reportsRoutes = new Elysia({ prefix: "/reports" })
  // Get all reports
  .get("/", async () => {
    const reports = await db.query.blotterReports.findMany({
      orderBy: desc(blotterReports.dateFiled), // ✅ Changed from createdAt
    });

    // ✅ Transform date strings to timestamps for Android compatibility
    const transformedReports = reports.map(report => ({
      ...report,
      // Convert "Jan 04, 2026" to timestamp (milliseconds)
      incidentDate: report.incidentDate ? new Date(report.incidentDate).getTime() : null,
      // Keep dateFiled as-is (already a timestamp)
    }));

    return {
      success: true,
      data: transformedReports,
    };
  })

  // Get report by ID
  .get("/:id", async ({ params, set }) => {
    const report = await db.query.blotterReports.findFirst({
      where: eq(blotterReports.id, parseInt(params.id)),
    });

    if (!report) {
      set.status = 404;
      return { success: false, message: "Report not found" };
    }

    // ✅ Transform date string to timestamp for Android compatibility
    const transformedReport = {
      ...report,
      incidentDate: report.incidentDate ? new Date(report.incidentDate).getTime() : null,
    };

    return {
      success: true,
      data: transformedReport,
    };
  })

  // ✅ Update case status (for Start Investigation button)
  .patch(
    "/:id/status",
    async ({ params, body, set }) => {
      const reportId = parseInt(params.id);

      const [updatedReport] = await db
        .update(blotterReports)
        .set({ status: body.status })
        .where(eq(blotterReports.id, reportId))
        .returning();

      if (!updatedReport) {
        set.status = 404;
        return { success: false, message: "Report not found" };
      }

      console.log(`✅ Case ${updatedReport.caseNumber} status updated to: ${body.status}`);

      // ✅ Transform date for Android compatibility
      const transformedReport = {
        ...updatedReport,
        incidentDate: updatedReport.incidentDate
          ? new Date(updatedReport.incidentDate).getTime()
          : null,
      };

      return {
        success: true,
        data: transformedReport,
      };
    },
    {
      body: t.Object({
        status: t.String(),
      }),
    }
  )

  // Create report
  .post(
    "/",
    async ({ body }) => {
      const [newReport] = await db
        .insert(blotterReports)
        .values(body)
        .returning();

      // Send notification to all admins about new case
      try {
        await FCM.notifyAdminsNewCase(
          newReport.caseNumber,
          newReport.id,
          newReport.complainantName || "Unknown"
        );

        // If filed by a user, notify them that case was filed successfully
        if (body.userId) {
          await FCM.notifyUserCaseFiled(db, body.userId, newReport.caseNumber);
        }
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      return {
        success: true,
        data: newReport,
      };
    },
    {
      body: t.Object({
        caseNumber: t.String(),
        incidentType: t.String(),
        incidentDate: t.String(),
        incidentTime: t.String(),
        incidentLocation: t.String(),
        narrative: t.String(), // ✅ Changed from 'statement'
        complainantName: t.Optional(t.String()),
        complainantContact: t.Optional(t.String()),
        complainantAddress: t.Optional(t.String()),
        status: t.Optional(t.String()),
        priority: t.Optional(t.String()),
        filedBy: t.Optional(t.String()),
        userId: t.Optional(t.Number()), // ✅ Changed from 'filedById'
        assignedOfficerIds: t.Optional(t.String()), // Comma-separated officer IDs (max 2)
        photoUrls: t.Optional(t.Array(t.String())), // Array of photo URLs
        videoUrls: t.Optional(t.Array(t.String())), // Array of video URLs
        respondentName: t.Optional(t.String()), // ✅ Changed from 'suspectName'
        respondentAlias: t.Optional(t.String()), // ✅ Changed from 'suspectAlias'
        relationship: t.Optional(t.String()), // ✅ Changed from 'relationToSuspect'
        respondentAddress: t.Optional(t.String()), // ✅ Changed from 'lastSeenSuspectAddress'
        respondentContact: t.Optional(t.String()), // ✅ Changed from 'suspectContact'
        accusation: t.Optional(t.String()), // ✅ Changed from 'suspectOffense'
      }),
    }
  )

  // Update report
  .put(
    "/:id",
    async ({ params, body, set }) => {
      // Get old report data before update
      const oldReport = await db.query.blotterReports.findFirst({
        where: eq(blotterReports.id, parseInt(params.id)),
      });

      const [updatedReport] = await db
        .update(blotterReports)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(blotterReports.id, parseInt(params.id)))
        .returning();

      if (!updatedReport) {
        set.status = 404;
        return { success: false, message: "Report not found" };
      }

      // Send notifications based on what changed
      try {
        // If status changed, notify complainant
        if (body.status && oldReport && body.status !== oldReport.status && updatedReport.userId) {
          await FCM.notifyUserStatusUpdate(
            db,
            updatedReport.userId,
            updatedReport.caseNumber,
            oldReport.status,
            body.status
          );
        }

        // If officer assigned, notify officer and complainant
        if (body.assignedOfficerIds && oldReport && body.assignedOfficerIds !== oldReport.assignedOfficerIds) {
          const officerIds = body.assignedOfficerIds.split(',').map(id => parseInt(id.trim()));

          for (const officerId of officerIds) {
            await FCM.notifyOfficerCaseAssigned(
              db,
              officerId,
              updatedReport.caseNumber,
              updatedReport.id,
              updatedReport.incidentType
            );
          }

          // Notify complainant about officer assignment
          if (updatedReport.userId && body.assignedOfficer) {
            await FCM.notifyUserOfficerAssigned(
              db,
              updatedReport.userId,
              updatedReport.caseNumber,
              body.assignedOfficer,
              "N/A"
            );
          }
        }
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      return {
        success: true,
        data: updatedReport,
      };
    },
    {
      body: t.Partial(
        t.Object({
          status: t.String(),
          assignedOfficer: t.String(),
          assignedOfficerIds: t.String(),
          priority: t.String(),
          isArchived: t.Boolean(),
          respondentName: t.String(),
          respondentAlias: t.String(),
          relationship: t.String(),
          respondentAddress: t.String(),
          respondentContact: t.String(),
          accusation: t.String(),
        })
      ),
    }
  )

  // Delete report
  .delete("/:id", async ({ params, set }) => {
    const [deletedReport] = await db
      .delete(blotterReports)
      .where(eq(blotterReports.id, parseInt(params.id)))
      .returning();

    if (!deletedReport) {
      set.status = 404;
      return { success: false, message: "Report not found" };
    }

    return {
      success: true,
      message: "Report deleted successfully",
    };
  })

  // Get reports filed by specific user
  .get("/user/:userId", async ({ params }) => {
    const userId = parseInt(params.userId);

    const userReports = await db.query.blotterReports.findMany({
      where: eq(blotterReports.userId, userId),
      orderBy: desc(blotterReports.dateFiled), // ✅ Changed from createdAt
    });

    console.log(`📋 Fetched ${userReports.length} reports for user ${userId}`);

    return {
      success: true,
      data: userReports,
    };
  })

  // Get reports by status
  .get("/status/:status", async ({ params }) => {
    const reports = await db.query.blotterReports.findMany({
      where: eq(blotterReports.status, params.status),
      orderBy: desc(blotterReports.dateFiled), // ✅ Changed from createdAt
    });

    return {
      success: true,
      data: reports,
    };
  })

  // ✅ Get on-duty officers (for assign dialog)
  .get("/on-duty-officers", async () => {
    const { officers } = await import("../db/schema");

    const onDutyOfficers = await db.query.officers.findMany({
      where: (officers, { eq, and }) => and(
        eq(officers.isActive, true),
        eq(officers.onDuty, true) // ✅ Now filtering by onDuty field
      ),
    });

    console.log(`👮 Found ${onDutyOfficers.length} on-duty officers`);

    return {
      success: true,
      data: onDutyOfficers,
    };
  })

  // ✅ Assign officers to case (max 2)
  .patch(
    "/:id/assign-officers",
    async ({ params, body, set }) => {
      const reportId = parseInt(params.id);
      const { officerIds } = body;

      // Validate max 2 officers
      if (officerIds.length > 2) {
        set.status = 400;
        return {
          success: false,
          message: "Maximum 2 officers can be assigned to a case",
        };
      }

      // Convert to comma-separated string
      const assignedOfficerIds = officerIds.join(",");

      // ✅ Fetch officer names for assignedOfficer field
      const { officers } = await import("../db/schema");
      const officerRecords = await db.query.officers.findMany({
        where: (officers, { inArray }) => inArray(officers.id, officerIds),
      });

      const officerNames = officerRecords.map(o => o.name).join(", ");

      console.log(`📝 Assigning officers: ${officerNames} (IDs: ${assignedOfficerIds})`);

      // Update report
      const [updatedReport] = await db
        .update(blotterReports)
        .set({
          assignedOfficerIds,
          assignedOfficer: officerNames, // ✅ Set officer names for timeline
          status: "Assigned", // Update status
          updatedAt: new Date()
        })
        .where(eq(blotterReports.id, reportId))
        .returning();

      if (!updatedReport) {
        set.status = 404;
        return { success: false, message: "Report not found" };
      }

      // Send notifications to assigned officers
      try {
        for (const officerId of officerIds) {
          await FCM.notifyOfficerCaseAssigned(
            db,
            officerId,
            updatedReport.caseNumber,
            updatedReport.id,
            updatedReport.incidentType
          );
        }

        // Notify complainant about officer assignment
        if (updatedReport.userId) {
          await FCM.notifyUserOfficerAssigned(
            db,
            updatedReport.userId,
            updatedReport.caseNumber,
            `${officerIds.length} officer(s)`,
            "N/A"
          );
        }
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      console.log(`✅ Assigned ${officerIds.length} officer(s) to case ${updatedReport.caseNumber}`);

      // ✅ Convert incidentDate from string to timestamp for Android compatibility
      const responseData = {
        ...updatedReport,
        incidentDate: updatedReport.incidentDate
          ? new Date(updatedReport.incidentDate).getTime()
          : null
      };

      return {
        success: true,
        data: responseData,
      };
    },
    {
      body: t.Object({
        officerIds: t.Array(t.Number()),
      }),
    }
  )

  // Get reports by user ID
  .get("/user/:userId", async ({ params, set }) => {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      set.status = 400;
      return { success: false, message: "Invalid user ID" };
    }

    const reports = await db.query.blotterReports.findMany({
      where: eq(blotterReports.userId, userId),
      orderBy: desc(blotterReports.dateFiled),
    });

    // ✅ Transform date strings to timestamps for Android compatibility
    const transformedReports = reports.map(report => ({
      ...report,
      // Convert "Jan 04, 2026" to timestamp (milliseconds)
      incidentDate: report.incidentDate ? new Date(report.incidentDate).getTime() : null,
      // Keep dateFiled as-is (already a timestamp)
    }));

    return {
      success: true,
      data: transformedReports,
    };
  })

  // Get reports assigned to specific officer
  .get("/officer/:officerId", async ({ params, set }) => {
    const officerId = parseInt(params.officerId);

    if (isNaN(officerId)) {
      set.status = 400;
      return { success: false, message: "Invalid officer ID" };
    }

    console.log(`📋 Fetching reports for officer ID: ${officerId}`);

    // Get all reports and filter by assignedOfficerIds
    const allReports = await db.query.blotterReports.findMany({
      orderBy: desc(blotterReports.dateFiled),
    });

    // Filter reports where this officer is assigned
    const officerReports = allReports.filter(report => {
      if (!report.assignedOfficerIds) return false;

      try {
        // assignedOfficerIds is a comma-separated string like "1,2"
        const officerIds = report.assignedOfficerIds
          .split(',')
          .map(id => parseInt(id.trim()));

        return officerIds.includes(officerId);
      } catch {
        return false;
      }
    });

    console.log(`✅ Found ${officerReports.length} reports for officer ${officerId}`);

    // Transform date strings to timestamps for Android compatibility
    const transformedReports = officerReports.map(report => ({
      ...report,
      incidentDate: report.incidentDate ? new Date(report.incidentDate).getTime() : null,
    }));

    return {
      success: true,
      data: transformedReports,
    };
  })

  // Get report statistics by user ID
  .get("/stats/:userId", async ({ params, set }) => {
    const userId = parseInt(params.userId);

    if (isNaN(userId)) {
      set.status = 400;
      return { success: false, message: "Invalid user ID" };
    }

    const allReports = await db.query.blotterReports.findMany({
      where: eq(blotterReports.userId, userId),
    });

    const stats = {
      total: allReports.length,
      pending: allReports.filter(r => r.status === "Pending").length,
      ongoing: allReports.filter(r => r.status === "Ongoing" || r.status === "Under Investigation").length,
      resolved: allReports.filter(r => r.status === "Resolved" || r.status === "Closed").length,
    };

    return {
      success: true,
      data: stats,
    };
  });
