import { db } from "./index";
import { users, officers, blotterReports, notifications } from "./schema";

/**
 * Database Seeder - Creates sample data for testing
 */
async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Create Admin User
    console.log("Creating admin user...");
    const [admin] = await db
      .insert(users)
      .values({
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        password: "admin123", // In production, this should be hashed!
        role: "Admin",
        isActive: true,
        profileCompleted: true,
        mustChangePassword: false,
      })
      .returning();
    console.log("✅ Admin created:", admin.username);

    // 2. Create Officer User
    console.log("Creating officer user...");
    const [officer] = await db
      .insert(users)
      .values({
        firstName: "Juan",
        lastName: "Dela Cruz",
        username: "officer1",
        password: "officer123",
        role: "Officer",
        badgeNumber: "OFF-001",
        isActive: true,
        profileCompleted: true,
        mustChangePassword: false,
      })
      .returning();
    console.log("✅ Officer created:", officer.username);

    // 3. Create Regular User
    console.log("Creating regular user...");
    const [user] = await db
      .insert(users)
      .values({
        firstName: "Maria",
        lastName: "Santos",
        username: "user1",
        password: "user123",
        role: "User",
        isActive: true,
        profileCompleted: true,
        mustChangePassword: false,
      })
      .returning();
    console.log("✅ User created:", user.username);

    // 4. Create Officer Record
    console.log("Creating officer record...");
    const [officerRecord] = await db
      .insert(officers)
      .values({
        name: "Juan Dela Cruz",
        badgeNumber: "OFF-001",
        rank: "Police Officer I",
        contactNumber: "09171234567",
        email: "juan.delacruz@police.gov.ph",
        userId: officer.id,
        isActive: true,
      })
      .returning();
    console.log("✅ Officer record created:", officerRecord.name);

    // 5. Create Sample Reports
    console.log("Creating sample reports...");
    
    const [report1] = await db
      .insert(blotterReports)
      .values({
        caseNumber: "2025-001",
        incidentType: "Theft",
        incidentDate: "2025-01-20",
        incidentTime: "14:30",
        incidentLocation: "CDO City, Misamis Oriental",
        narrative: "Complainant reported stolen motorcycle. Suspect was seen fleeing the scene.",
        complainantName: "Pedro Garcia",
        complainantContact: "09181234567",
        complainantAddress: "Barangay Carmen, CDO City",
        status: "Pending",
        priority: "High",
        filedBy: admin.firstName + " " + admin.lastName,
        filedById: admin.id,
        isArchived: false,
      })
      .returning();
    console.log("✅ Report created:", report1.caseNumber);

    const [report2] = await db
      .insert(blotterReports)
      .values({
        caseNumber: "2025-002",
        incidentType: "Physical Injury",
        incidentDate: "2025-01-22",
        incidentTime: "20:15",
        incidentLocation: "Barangay Kauswagan, CDO City",
        narrative: "Complainant sustained injuries during altercation with neighbor.",
        complainantName: "Ana Reyes",
        complainantContact: "09191234567",
        complainantAddress: "Barangay Kauswagan, CDO City",
        status: "Under Investigation",
        priority: "Normal",
        assignedOfficer: officerRecord.name,
        assignedOfficerIds: officerRecord.id.toString(),
        filedBy: officer.firstName + " " + officer.lastName,
        filedById: officer.id,
        isArchived: false,
      })
      .returning();
    console.log("✅ Report created:", report2.caseNumber);

    const [report3] = await db
      .insert(blotterReports)
      .values({
        caseNumber: "2025-003",
        incidentType: "Vandalism",
        incidentDate: "2025-01-15",
        incidentTime: "03:00",
        incidentLocation: "Barangay Nazareth, CDO City",
        narrative: "Property vandalized with graffiti. Investigation completed.",
        complainantName: "Jose Martinez",
        complainantContact: "09201234567",
        complainantAddress: "Barangay Nazareth, CDO City",
        status: "Resolved",
        priority: "Low",
        assignedOfficer: officerRecord.name,
        assignedOfficerIds: officerRecord.id.toString(),
        filedBy: officer.firstName + " " + officer.lastName,
        filedById: officer.id,
        isArchived: false,
      })
      .returning();
    console.log("✅ Report created:", report3.caseNumber);

    // 6. Create Notifications
    console.log("Creating notifications...");
    await db.insert(notifications).values([
      {
        userId: admin.id,
        title: "Welcome to Blotter Management System",
        message: "Your admin account has been created successfully.",
        type: "system",
        isRead: false,
      },
      {
        userId: officer.id,
        title: "New Case Assigned",
        message: `You have been assigned to case ${report2.caseNumber}`,
        type: "assignment",
        caseId: report2.id,
        isRead: false,
      },
    ]);
    console.log("✅ Notifications created");

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- Users created: 3 (1 Admin, 1 Officer, 1 User)");
    console.log("- Officers created: 1");
    console.log("- Reports created: 3");
    console.log("- Notifications created: 2");
    console.log("\n🔑 Test Credentials:");
    console.log("┌─────────────────────────────────────────┐");
    console.log("│ Admin:   username=admin, password=admin123");
    console.log("│ Officer: username=officer1, password=officer123");
    console.log("│ User:    username=user1, password=user123");
    console.log("└─────────────────────────────────────────┘");
    console.log("\n⚠️  Note: Public registration (/api/auth/register) only creates User accounts.");
    console.log("   Officers and Admins must be created by Admin through user management.");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeder
seed()
  .then(() => {
    console.log("\n✅ Seeding complete! You can now test the API.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
