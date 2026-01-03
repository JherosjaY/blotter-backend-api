import { db } from "./index";
import { admins } from "./schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function resetAdminPassword() {
    console.log("🔄 Resetting admin password...");

    const adminUsername = "official.bms.admin";
    const adminPassword = "@BMSOFFICIAL2025";

    try {
        // Check if admin exists
        const existingAdmin = await db.query.admins.findFirst({
            where: eq(admins.username, adminUsername),
        });

        if (existingAdmin) {
            console.log("✅ Admin found - updating password...");

            // Hash new password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Update password
            await db.update(admins)
                .set({ password: hashedPassword })
                .where(eq(admins.username, adminUsername));

            console.log("✅ Admin password updated successfully!");
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Password: ${adminPassword}`);
        } else {
            console.log("❌ Admin not found - creating new admin...");

            // Hash password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Create admin
            await db.insert(admins).values({
                username: adminUsername,
                password: hashedPassword,
            });

            console.log("✅ Admin created successfully!");
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Password: ${adminPassword}`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error resetting admin password:", error);
        process.exit(1);
    }
}

resetAdminPassword();
