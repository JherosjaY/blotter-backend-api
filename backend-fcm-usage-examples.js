/**
 * ============================================
 * FCM USAGE EXAMPLES FOR ELYSIA.JS BACKEND
 * ============================================
 * 
 * Copy these examples into your Elysia.js routes
 * 
 * ============================================
 */

import FCM from './backend-fcm-helper.js';

// Initialize FCM when your app starts
FCM.initializeFCM();

// ============================================
// EXAMPLE 1: ADMIN ASSIGNS CASE TO OFFICER
// ============================================

app.post('/api/cases/assign', async ({ body, db }) => {
  const { caseId, officerId, caseNumber, incidentType } = body;
  
  try {
    // 1. Update database
    await db.cases.update(
      { id: caseId },
      { assignedTo: officerId, status: 'Under Investigation' }
    );
    
    // 2. Send notification to officer
    await FCM.notifyOfficerCaseAssigned(
      db,
      officerId,
      caseNumber,
      caseId,
      incidentType
    );
    
    // 3. Send notification to complainant
    const caseData = await db.cases.findOne({ id: caseId });
    await FCM.notifyUserOfficerAssigned(
      db,
      caseData.complainantId,
      caseNumber,
      'Officer Juan Dela Cruz',
      'PO-12345'
    );
    
    return { success: true, message: 'Case assigned successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// EXAMPLE 2: USER FILES NEW CASE
// ============================================

app.post('/api/cases/file', async ({ body, db }) => {
  const { complainantId, incidentType, description, location } = body;
  
  try {
    // 1. Create case in database
    const caseNumber = generateCaseNumber(); // Your function
    const newCase = await db.cases.insert({
      caseNumber,
      complainantId,
      incidentType,
      description,
      location,
      status: 'Pending',
      createdAt: new Date()
    });
    
    // 2. Notify user that case was filed
    await FCM.notifyUserCaseFiled(db, complainantId, caseNumber);
    
    // 3. Notify all admins about new case
    await FCM.notifyAdminsNewCase(
      caseNumber,
      newCase.id,
      'Juan Dela Cruz' // Get from user data
    );
    
    // 4. If urgent, send urgent notification
    if (incidentType === 'Physical Assault' || incidentType === 'Theft') {
      await FCM.notifyAdminsUrgentCase(
        caseNumber,
        newCase.id,
        incidentType
      );
    }
    
    return { success: true, caseNumber, caseId: newCase.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// EXAMPLE 3: ADMIN CHANGES CASE STATUS
// ============================================

app.put('/api/cases/:id/status', async ({ params, body, db }) => {
  const { id } = params;
  const { status } = body;
  
  try {
    // 1. Get current case data
    const caseData = await db.cases.findOne({ id });
    const oldStatus = caseData.status;
    
    // 2. Update status in database
    await db.cases.update({ id }, { status });
    
    // 3. Notify complainant about status change
    await FCM.notifyUserStatusUpdate(
      db,
      caseData.complainantId,
      caseData.caseNumber,
      oldStatus,
      status
    );
    
    // 4. If assigned to officer, notify them too
    if (caseData.assignedTo) {
      await FCM.notifyUserStatusUpdate(
        db,
        caseData.assignedTo,
        caseData.caseNumber,
        oldStatus,
        status
      );
    }
    
    return { success: true, message: 'Status updated successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// EXAMPLE 4: SCHEDULE HEARING
// ============================================

app.post('/api/hearings/schedule', async ({ body, db }) => {
  const { caseId, hearingDate, location, time } = body;
  
  try {
    // 1. Get case data
    const caseData = await db.cases.findOne({ id: caseId });
    
    // 2. Create hearing in database
    await db.hearings.insert({
      caseId,
      hearingDate,
      location,
      time,
      status: 'Scheduled'
    });
    
    // 3. Notify complainant
    await FCM.notifyUserHearingScheduled(
      db,
      caseData.complainantId,
      caseData.caseNumber,
      hearingDate,
      location,
      time
    );
    
    // 4. Notify respondent (if exists)
    if (caseData.respondentId) {
      await FCM.notifyUserHearingScheduled(
        db,
        caseData.respondentId,
        caseData.caseNumber,
        hearingDate,
        location,
        time
      );
    }
    
    // 5. Notify assigned officer
    if (caseData.assignedTo) {
      await FCM.notifyOfficerHearingScheduled(
        db,
        caseData.assignedTo,
        caseData.caseNumber,
        hearingDate,
        location
      );
    }
    
    return { success: true, message: 'Hearing scheduled successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// EXAMPLE 5: RESOLVE CASE
// ============================================

app.post('/api/cases/:id/resolve', async ({ params, body, db }) => {
  const { id } = params;
  const { resolution } = body;
  
  try {
    // 1. Get case data
    const caseData = await db.cases.findOne({ id });
    
    // 2. Update case in database
    await db.cases.update(
      { id },
      { 
        status: 'Resolved',
        resolution,
        resolvedAt: new Date()
      }
    );
    
    // 3. Notify complainant
    await FCM.notifyUserCaseResolved(
      db,
      caseData.complainantId,
      caseData.caseNumber,
      resolution
    );
    
    // 4. Notify respondent (if exists)
    if (caseData.respondentId) {
      await FCM.notifyUserCaseResolved(
        db,
        caseData.respondentId,
        caseData.caseNumber,
        resolution
      );
    }
    
    return { success: true, message: 'Case resolved successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// EXAMPLE 6: DAILY HEARING REMINDERS (CRON JOB)
// ============================================

// Run this every day at 9:00 AM
async function sendHearingReminders(db) {
  try {
    // Get all hearings for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingHearings = await db.hearings.find({
      hearingDate: tomorrow.toISOString().split('T')[0],
      status: 'Scheduled'
    });
    
    for (const hearing of upcomingHearings) {
      const caseData = await db.cases.findOne({ id: hearing.caseId });
      
      // Notify complainant
      await FCM.notifyUserHearingReminder(
        db,
        caseData.complainantId,
        caseData.caseNumber,
        hearing.hearingDate,
        hearing.location,
        hearing.time
      );
      
      // Notify respondent
      if (caseData.respondentId) {
        await FCM.notifyUserHearingReminder(
          db,
          caseData.respondentId,
          caseData.caseNumber,
          hearing.hearingDate,
          hearing.location,
          hearing.time
        );
      }
      
      // Notify officer
      if (caseData.assignedTo) {
        await FCM.notifyOfficerHearingReminder(
          db,
          caseData.assignedTo,
          caseData.caseNumber,
          hearing.hearingDate,
          hearing.location
        );
      }
    }
    
    console.log(`✅ Sent ${upcomingHearings.length} hearing reminders`);
  } catch (error) {
    console.error('❌ Error sending hearing reminders:', error);
  }
}

// ============================================
// EXAMPLE 7: OFFICER ADDS EVIDENCE
// ============================================

app.post('/api/cases/:id/evidence', async ({ params, body, db }) => {
  const { id } = params;
  const { evidenceType, description, fileUrl } = body;
  
  try {
    // 1. Get case data
    const caseData = await db.cases.findOne({ id });
    
    // 2. Add evidence to database
    await db.evidence.insert({
      caseId: id,
      evidenceType,
      description,
      fileUrl,
      addedAt: new Date()
    });
    
    // 3. Notify complainant
    await FCM.notifyUserStatusUpdate(
      db,
      caseData.complainantId,
      caseData.caseNumber,
      caseData.status,
      caseData.status // Same status, just notification
    );
    
    return { success: true, message: 'Evidence added successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// EXAMPLE 8: SYSTEM MAINTENANCE NOTIFICATION
// ============================================

app.post('/api/admin/notify-maintenance', async ({ body }) => {
  const { maintenanceDate, duration } = body;
  
  try {
    // Notify all users
    await FCM.notifyAllUsersSystemMaintenance(maintenanceDate, duration);
    
    return { success: true, message: 'Maintenance notification sent' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// EXAMPLE 9: SAVE FCM TOKEN (FROM ANDROID APP)
// ============================================

app.post('/api/users/fcm-token', async ({ body, db }) => {
  const { userId, fcmToken, deviceId } = body;
  
  try {
    // Update user's FCM token in database
    await db.users.update(
      { id: userId },
      { 
        fcmToken,
        deviceId,
        tokenUpdatedAt: new Date()
      }
    );
    
    console.log(`✅ FCM token updated for user ${userId}`);
    
    return { success: true, message: 'FCM token saved successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================
// EXAMPLE 10: RESPONDENT NOTIFIED ABOUT COMPLAINT
// ============================================

app.post('/api/cases/:id/notify-respondent', async ({ params, body, db }) => {
  const { id } = params;
  const { respondentId } = body;
  
  try {
    // 1. Get case data
    const caseData = await db.cases.findOne({ id });
    
    // 2. Update case with respondent
    await db.cases.update({ id }, { respondentId });
    
    // 3. Notify respondent
    await FCM.notifyRespondentComplaintFiled(
      db,
      respondentId,
      caseData.caseNumber,
      'Juan Dela Cruz', // Get complainant name
      caseData.incidentType
    );
    
    return { success: true, message: 'Respondent notified' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

export {
  sendHearingReminders
};
