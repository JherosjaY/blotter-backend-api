import { db } from "./index";
import { admins } from "./schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function setupAdmin() {
    console.log("🌱 Setting up admin account...");

    const adminUsername = "official.bms.admin";
    const adminPassword = "@BMSOFFICIAL2025";

    try {
        // Check if admin already exists
        const existingAdmin = await db.query.admins.findFirst({
            where: eq(admins.username, adminUsername),
        });

        if (existingAdmin) {
            console.log("✅ Admin account found - updating password to ensure it's correct...");

            // Hash password
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Update password to ensure it matches
            await db.update(admins)
                .set({ password: hashedPassword })
                .where(eq(admins.username, adminUsername));

            console.log("✅ Admin password updated successfully");
            console.log(`   Username: ${adminUsername}`);
            console.log(`   Password: ${adminPassword}`);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Insert admin
        await db.insert(admins).values({
            username: adminUsername,
            password: hashedPassword,
        });

        console.log("✅ Admin account created successfully");
        console.log(`   Username: ${adminUsername}`);
        console.log(`   Password: ${adminPassword}`);
        console.log("");
        console.log("🎉 You can now login from any device using these credentials!");
    } catch (error) {
        console.error("❌ Error setting up admin:", error);
        throw error;
    }
}

// Auto-run when backend starts
setupAdmin().catch(console.error);

export { setupAdmin };
