import { pgTable, serial, varchar, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

// Verification Codes Table (for email verification)
export const verificationCodes = pgTable("verification_codes", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 100 }).notNull(),
    code: varchar("code", { length: 6 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    verifiedAt: timestamp("verified_at"), // ✅ Track when code was successfully used
});
