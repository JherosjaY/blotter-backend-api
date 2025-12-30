/**
 * ============================================
 * BLOTTER MANAGEMENT SYSTEM - FCM HELPER
 * ============================================
 * 
 * Firebase Cloud Messaging Helper for Backend
 * Handles automatic push notifications for all 3 roles:
 * - Admin
 * - Officer
 * - User (Complainant/Respondent)
 * 
 * SETUP:
 * 1. npm install firebase-admin
 * 2. Download firebase-service-account.json from Firebase Console
 * 3. Place it in your backend root directory
 * 4. Import this file in your routes
 * 
 * ============================================
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (do this once in your app)
let isInitialized = false;

export function initializeFCM() {
  if (!isInitialized) {
    try {
      // Try to use environment variables first (for production)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          })
        });
        console.log('✅ Firebase Admin SDK initialized (from environment variables)');
        isInitialized = true;
      } else {
        // Try JSON file (for local development)
        try {
          const serviceAccount = require('./firebase-service-account.json');
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          console.log('✅ Firebase Admin SDK initialized (from JSON file)');
          isInitialized = true;
        } catch (fileError) {
          console.warn('⚠️ Firebase Admin SDK not initialized - FCM notifications will be disabled');
          console.warn('⚠️ To enable FCM, set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL environment variables');
          // Don't throw error - allow app to run without FCM
          isInitialized = false;
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      console.warn('⚠️ FCM notifications will be disabled');
      // Don't throw error - allow app to run without FCM
      isInitialized = false;
    }
  }
}

// ============================================
// CORE NOTIFICATION FUNCTIONS
// ============================================

/**
 * Send notification to specific user by FCM token
 */
async function sendToToken(fcmToken, notification) {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: notification.channelId || 'general'
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to specific user by user ID
 * (Looks up FCM token from database)
 */
export async function sendNotificationToUser(db, userId, notification) {
  try {
    // Get user's FCM token from database
    const user = await db.users.findOne({ id: userId });
    
    if (!user) {
      console.log(`⚠️ User ${userId} not found`);
      return { success: false, error: 'User not found' };
    }
    
    if (!user.fcmToken) {
      console.log(`⚠️ No FCM token for user ${userId}`);
      return { success: false, error: 'No FCM token' };
    }
    
    return await sendToToken(user.fcmToken, notification);
  } catch (error) {
    console.error('❌ Error sending notification to user:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple users
 */
export async function sendNotificationToUsers(db, userIds, notification) {
  const results = await Promise.all(
    userIds.map(userId => sendNotificationToUser(db, userId, notification))
  );
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Sent to ${successCount}/${userIds.length} users`);
  
  return { successCount, total: userIds.length, results };
}

/**
 * Send notification to topic (role-based)
 */
export async function sendNotificationToTopic(topic, notification) {
  try {
    const message = {
      topic: topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: notification.channelId || 'general'
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    console.log(`✅ Notification sent to topic ${topic}:`, response);
    return { success: true, response };
  } catch (error) {
    console.error(`❌ Error sending notification to topic ${topic}:`, error);
    return { success: false, error: error.message };
  }
}

// ============================================
// ADMIN NOTIFICATIONS
// ============================================

/**
 * Notify all admins about new case filed
 */
export async function notifyAdminsNewCase(caseNumber, reportId, complainantName) {
  return await sendNotificationToTopic('admins', {
    title: '🆕 New Case Filed',
    body: `Case #${caseNumber} filed by ${complainantName}`,
    channelId: 'blotter_reports',
    data: {
      type: 'new_report',
      case_number: caseNumber,
      report_id: reportId.toString()
    }
  });
}

/**
 * Notify all admins about urgent case
 */
export async function notifyAdminsUrgentCase(caseNumber, reportId, incidentType) {
  return await sendNotificationToTopic('admins', {
    title: '🚨 URGENT CASE',
    body: `${incidentType} - Case #${caseNumber} requires immediate attention`,
    channelId: 'blotter_reports',
    data: {
      type: 'urgent_case',
      case_number: caseNumber,
      report_id: reportId.toString(),
      incident_type: incidentType
    }
  });
}

/**
 * Notify admin about case closure request
 */
export async function notifyAdminCaseClosureRequest(db, adminId, caseNumber, officerName) {
  return await sendNotificationToUser(db, adminId, {
    title: '📋 Case Closure Request',
    body: `Officer ${officerName} requests to close Case #${caseNumber}`,
    channelId: 'status_updates',
    data: {
      type: 'closure_request',
      case_number: caseNumber
    }
  });
}

// ============================================
// OFFICER NOTIFICATIONS
// ============================================

/**
 * Notify officer about case assignment
 */
export async function notifyOfficerCaseAssigned(db, officerId, caseNumber, reportId, incidentType) {
  return await sendNotificationToUser(db, officerId, {
    title: '👮 New Case Assigned',
    body: `${incidentType} - Case #${caseNumber} has been assigned to you`,
    channelId: 'blotter_reports',
    data: {
      type: 'case_assigned',
      case_number: caseNumber,
      report_id: reportId.toString(),
      incident_type: incidentType
    }
  });
}

/**
 * Notify officer about case reassignment
 */
export async function notifyOfficerCaseReassigned(db, officerId, caseNumber, reason) {
  return await sendNotificationToUser(db, officerId, {
    title: '🔄 Case Reassigned',
    body: `Case #${caseNumber} has been reassigned to you. Reason: ${reason}`,
    channelId: 'blotter_reports',
    data: {
      type: 'case_reassigned',
      case_number: caseNumber,
      reason: reason
    }
  });
}

/**
 * Notify officer about hearing scheduled
 */
export async function notifyOfficerHearingScheduled(db, officerId, caseNumber, hearingDate, location) {
  return await sendNotificationToUser(db, officerId, {
    title: '📅 Hearing Scheduled',
    body: `Hearing for Case #${caseNumber} on ${hearingDate} at ${location}`,
    channelId: 'hearings',
    data: {
      type: 'hearing_scheduled',
      case_number: caseNumber,
      hearing_date: hearingDate,
      location: location
    }
  });
}

/**
 * Notify officer about hearing reminder (1 day before)
 */
export async function notifyOfficerHearingReminder(db, officerId, caseNumber, hearingDate, location) {
  return await sendNotificationToUser(db, officerId, {
    title: '⏰ Hearing Reminder',
    body: `Hearing for Case #${caseNumber} is tomorrow at ${location}`,
    channelId: 'hearings',
    data: {
      type: 'hearing_reminder',
      case_number: caseNumber,
      hearing_date: hearingDate,
      location: location
    }
  });
}

/**
 * Notify officer about new evidence added
 */
export async function notifyOfficerNewEvidence(db, officerId, caseNumber, evidenceType) {
  return await sendNotificationToUser(db, officerId, {
    title: '📎 New Evidence Added',
    body: `${evidenceType} evidence added to Case #${caseNumber}`,
    channelId: 'status_updates',
    data: {
      type: 'new_evidence',
      case_number: caseNumber,
      evidence_type: evidenceType
    }
  });
}

/**
 * Notify officer about new witness statement
 */
export async function notifyOfficerNewWitness(db, officerId, caseNumber, witnessName) {
  return await sendNotificationToUser(db, officerId, {
    title: '👤 New Witness Statement',
    body: `Witness ${witnessName} added to Case #${caseNumber}`,
    channelId: 'status_updates',
    data: {
      type: 'new_witness',
      case_number: caseNumber
    }
  });
}

// ============================================
// USER (COMPLAINANT/RESPONDENT) NOTIFICATIONS
// ============================================

/**
 * Notify user about case filed successfully
 */
export async function notifyUserCaseFiled(db, userId, caseNumber) {
  return await sendNotificationToUser(db, userId, {
    title: '✅ Case Filed Successfully',
    body: `Your case #${caseNumber} has been filed and is under review`,
    channelId: 'status_updates',
    data: {
      type: 'case_filed',
      case_number: caseNumber
    }
  });
}

/**
 * Notify user about case status update
 */
export async function notifyUserStatusUpdate(db, userId, caseNumber, oldStatus, newStatus) {
  const statusEmoji = {
    'Pending': '⏳',
    'Under Investigation': '🔍',
    'For Hearing': '📋',
    'Resolved': '✅',
    'Closed': '🔒',
    'Dismissed': '❌'
  };
  
  return await sendNotificationToUser(db, userId, {
    title: `${statusEmoji[newStatus] || '📢'} Status Update`,
    body: `Case #${caseNumber} is now ${newStatus}`,
    channelId: 'status_updates',
    data: {
      type: 'status_update',
      case_number: caseNumber,
      old_status: oldStatus,
      new_status: newStatus
    }
  });
}

/**
 * Notify user about officer assigned
 */
export async function notifyUserOfficerAssigned(db, userId, caseNumber, officerName, badgeNumber) {
  return await sendNotificationToUser(db, userId, {
    title: '👮 Officer Assigned',
    body: `Officer ${officerName} (Badge #${badgeNumber}) has been assigned to your case #${caseNumber}`,
    channelId: 'status_updates',
    data: {
      type: 'officer_assigned',
      case_number: caseNumber,
      officer_name: officerName,
      badge_number: badgeNumber
    }
  });
}

/**
 * Notify user about hearing scheduled
 */
export async function notifyUserHearingScheduled(db, userId, caseNumber, hearingDate, location, time) {
  return await sendNotificationToUser(db, userId, {
    title: '📅 Hearing Scheduled',
    body: `Your hearing for Case #${caseNumber} is on ${hearingDate} at ${time}`,
    channelId: 'hearings',
    data: {
      type: 'hearing_scheduled',
      case_number: caseNumber,
      hearing_date: hearingDate,
      location: location,
      time: time
    }
  });
}

/**
 * Notify user about hearing reminder (1 day before)
 */
export async function notifyUserHearingReminder(db, userId, caseNumber, hearingDate, location, time) {
  return await sendNotificationToUser(db, userId, {
    title: '⏰ Hearing Reminder',
    body: `Your hearing for Case #${caseNumber} is tomorrow at ${time} in ${location}`,
    channelId: 'hearings',
    data: {
      type: 'hearing_reminder',
      case_number: caseNumber,
      hearing_date: hearingDate,
      location: location,
      time: time
    }
  });
}

/**
 * Notify user about hearing rescheduled
 */
export async function notifyUserHearingRescheduled(db, userId, caseNumber, oldDate, newDate, reason) {
  return await sendNotificationToUser(db, userId, {
    title: '🔄 Hearing Rescheduled',
    body: `Hearing for Case #${caseNumber} moved from ${oldDate} to ${newDate}`,
    channelId: 'hearings',
    data: {
      type: 'hearing_rescheduled',
      case_number: caseNumber,
      old_date: oldDate,
      new_date: newDate,
      reason: reason
    }
  });
}

/**
 * Notify user about case resolved
 */
export async function notifyUserCaseResolved(db, userId, caseNumber, resolution) {
  return await sendNotificationToUser(db, userId, {
    title: '✅ Case Resolved',
    body: `Case #${caseNumber} has been resolved: ${resolution}`,
    channelId: 'status_updates',
    data: {
      type: 'case_resolved',
      case_number: caseNumber,
      resolution: resolution
    }
  });
}

/**
 * Notify user about case closed
 */
export async function notifyUserCaseClosed(db, userId, caseNumber, reason) {
  return await sendNotificationToUser(db, userId, {
    title: '🔒 Case Closed',
    body: `Case #${caseNumber} has been closed. ${reason}`,
    channelId: 'status_updates',
    data: {
      type: 'case_closed',
      case_number: caseNumber,
      reason: reason
    }
  });
}

/**
 * Notify user about summons issued
 */
export async function notifyUserSummonsIssued(db, userId, caseNumber, summonsDate) {
  return await sendNotificationToUser(db, userId, {
    title: '📜 Summons Issued',
    body: `You have been summoned for Case #${caseNumber} on ${summonsDate}`,
    channelId: 'hearings',
    data: {
      type: 'summons_issued',
      case_number: caseNumber,
      summons_date: summonsDate
    }
  });
}

/**
 * Notify respondent about complaint filed against them
 */
export async function notifyRespondentComplaintFiled(db, userId, caseNumber, complainantName, incidentType) {
  return await sendNotificationToUser(db, userId, {
    title: '⚠️ Complaint Filed',
    body: `A complaint (${incidentType}) has been filed against you - Case #${caseNumber}`,
    channelId: 'blotter_reports',
    data: {
      type: 'complaint_filed',
      case_number: caseNumber,
      incident_type: incidentType
    }
  });
}

// ============================================
// BULK NOTIFICATIONS
// ============================================

/**
 * Notify all users about system maintenance
 */
export async function notifyAllUsersSystemMaintenance(maintenanceDate, duration) {
  return await sendNotificationToTopic('all_users', {
    title: '🔧 System Maintenance',
    body: `System will be under maintenance on ${maintenanceDate} for ${duration}`,
    channelId: 'general',
    data: {
      type: 'system_maintenance',
      maintenance_date: maintenanceDate,
      duration: duration
    }
  });
}

/**
 * Notify all users about app update
 */
export async function notifyAllUsersAppUpdate(version, features) {
  return await sendNotificationToTopic('all_users', {
    title: '🎉 New Update Available',
    body: `Version ${version} is now available with new features!`,
    channelId: 'general',
    data: {
      type: 'app_update',
      version: version,
      features: features
    }
  });
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  initializeFCM,
  
  // Core functions
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToTopic,
  
  // Admin notifications
  notifyAdminsNewCase,
  notifyAdminsUrgentCase,
  notifyAdminCaseClosureRequest,
  
  // Officer notifications
  notifyOfficerCaseAssigned,
  notifyOfficerCaseReassigned,
  notifyOfficerHearingScheduled,
  notifyOfficerHearingReminder,
  notifyOfficerNewEvidence,
  notifyOfficerNewWitness,
  
  // User notifications
  notifyUserCaseFiled,
  notifyUserStatusUpdate,
  notifyUserOfficerAssigned,
  notifyUserHearingScheduled,
  notifyUserHearingReminder,
  notifyUserHearingRescheduled,
  notifyUserCaseResolved,
  notifyUserCaseClosed,
  notifyUserSummonsIssued,
  notifyRespondentComplaintFiled,
  
  // Bulk notifications
  notifyAllUsersSystemMaintenance,
  notifyAllUsersAppUpdate
};
