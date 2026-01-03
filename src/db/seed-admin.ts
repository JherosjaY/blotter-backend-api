import { db } from "./index";
import { admins } from "./schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function seedAdmin() {
    console.log("🌱 Seeding admin account...");

    const adminUsername = "official.bms.admin";
    const adminPassword = "@BMSOFFICIAL2025";

    try {
        // Check if admin already exists
        const existingAdmin = await db.query.admins.findFirst({
            where: eq(admins.username, adminUsername),
        });

        if (existingAdmin) {
            console.log("✅ Admin account already exists");
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
    } catch (error) {
        console.error("❌ Error seeding admin:", error);
        throw error;
    }
}

// Run seed if this file is executed directly
if (import.meta.main) {
    seedAdmin()
        .then(() => {
            console.log("✅ Seed completed");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Seed failed:", error);
            process.exit(1);
        });
}

export { seedAdmin };
