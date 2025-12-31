import { Elysia, t } from "elysia";
import { db } from "../db";
import { users, verificationCodes } from "../db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "../lib/sendgrid";

// Helper function to generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  // Register with Email Verification (Partial Registration)
  .post(
    "/register",
    async ({ body, set }) => {
      const { username, email, password } = body;

      // Check if username exists
      const existingUsername = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUsername) {
        set.status = 400;
        return { success: false, message: "Username already exists" };
      }

      // ✅ Check if email already exists in users table
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingEmail) {
        set.status = 400;
        return { success: false, message: "This email is already registered. Please sign in." };
      }

      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user immediately with partial data
        const [newUser] = await db
          .insert(users)
          .values({
            username,
            email, // ✅ Store email in users table
            password: hashedPassword,
            firstName: "", // Will be filled in profile setup
            lastName: "", // Will be filled in profile setup
            isActive: false, // Not active until email verified
            profileCompleted: false,
          })
          .returning();

        // Generate 6-digit verification code
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // ✅ Delete any existing verification codes for this email first
        await db.delete(verificationCodes).where(eq(verificationCodes.email, email));

        // Store verification code
        await db.insert(verificationCodes).values({
          email,
          code,
          expiresAt,
        });

        // ❌ REMOVED: Don't send email automatically - user must click "Send" button
        // await sendVerificationEmail(email, code, username);

        return {
          success: true,
          message: "Verification code sent to your email",
          data: {
            email,
            userId: newUser.id,
            expiresIn: "10 minutes",
          },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to send verification email",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )

  // Verify Email and Activate Account
  .post(
    "/verify-email",
    async ({ body, set }) => {
      const { email, code } = body;

      // Find valid verification code (not expired and not already used)
      const verification = await db.query.verificationCodes.findFirst({
        where: and(
          eq(verificationCodes.email, email),
          eq(verificationCodes.code, code),
          gt(verificationCodes.expiresAt, new Date()),
          isNull(verificationCodes.verifiedAt) // ✅ Code must not be already verified
        ),
      });

      if (!verification) {
        set.status = 400;
        return {
          success: false,
          message: "Invalid or expired verification code",
        };
      }

      try {
        // ✅ Find user by email (now that email field exists in users table)
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          set.status = 404;
          return {
            success: false,
            message: "User not found",
          };
        }

        // Activate user account (email verified)
        const [updatedUser] = await db
          .update(users)
          .set({
            isActive: true, // Activate account
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();

        // ✅ Mark code as verified instead of deleting it
        await db
          .update(verificationCodes)
          .set({ verifiedAt: new Date() })
          .where(eq(verificationCodes.id, verification.id));

        // Generate token
        const token = Buffer.from(
          `${updatedUser.id}:${updatedUser.username}:${Date.now()}`
        ).toString("base64");

        return {
          success: true,
          message: "Email verified successfully",
          data: {
            user: {
              id: updatedUser.id,
              username: updatedUser.username,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              profileCompleted: updatedUser.profileCompleted,
            },
            token: token,
          },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to verify email",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        code: t.String(),
        username: t.Optional(t.String()),
      }),
    }
  )

  // Resend Verification Code
  .post(
    "/resend-code",
    async ({ body, set }) => {
      const { email } = body;

      // ✅ Check if there's already a valid verification code
      const existingCode = await db.query.verificationCodes.findFirst({
        where: and(
          eq(verificationCodes.email, email),
          gt(verificationCodes.expiresAt, new Date())
        ),
      });

      let codeToSend: string;

      if (existingCode) {
        // ✅ Reuse existing valid code
        codeToSend = existingCode.code;
        console.log(`♻️ Reusing existing code for ${email}`);
      } else {
        // ❌ No valid code exists, create new one
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        try {
          // Delete old codes for this email
          await db.delete(verificationCodes).where(eq(verificationCodes.email, email));

          // Store new verification code
          await db.insert(verificationCodes).values({
            email,
            code,
            expiresAt,
          });

          codeToSend = code;
          console.log(`🆕 Created new code for ${email}`);
        }

      // Send verification email with the code (existing or new)
      await sendVerificationEmail(email, codeToSend);

        return {
          success: true,
          message: "New verification code sent to your email",
          data: {
            email,
            expiresIn: "10 minutes",
          },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to resend verification code",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        email: t.String(),
      }),
    }
  )

  // Login
  .post(
    "/login",
    async ({ body, set }) => {
      const { username, password } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (!user) {
        set.status = 401;
        return { success: false, message: "Invalid credentials" };
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        set.status = 401;
        return { success: false, message: "Invalid credentials" };
      }

      if (!user.isActive) {
        set.status = 403;
        return { success: false, message: "Account is inactive" };
      }

      // Generate token
      const token = Buffer.from(
        `${user.id}:${user.username}:${Date.now()}`
      ).toString("base64");

      return {
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhotoUri: user.profilePhotoUri,
            profileCompleted: user.profileCompleted,
          },
          token: token,
        },
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )

  // Complete Profile (Step 3: Add firstName, lastName, profile photo)
  .post(
    "/complete-profile",
    async ({ body, set }) => {
      const { userId, firstName, lastName, profilePhotoUri } = body;

      try {
        // Find user by ID
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!user) {
          set.status = 404;
          return { success: false, message: "User not found" };
        }

        // Update user profile
        const [updatedUser] = await db
          .update(users)
          .set({
            firstName: firstName,
            lastName: lastName,
            profilePhotoUri: profilePhotoUri || null,
            profileCompleted: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();

        return {
          success: true,
          message: "Profile completed successfully",
          data: {
            user: {
              id: updatedUser.id,
              username: updatedUser.username,
              firstName: updatedUser.firstName,
              lastName: updatedUser.lastName,
              profilePhotoUri: updatedUser.profilePhotoUri,
              profileCompleted: updatedUser.profileCompleted,
            },
          },
        };
      } catch (error) {
        console.error("Complete profile error:", error);
        set.status = 500;
        return { success: false, message: "Failed to complete profile" };
      }
    },
    {
      body: t.Object({
        userId: t.Number(),
        firstName: t.String(),
        lastName: t.String(),
        profilePhotoUri: t.Optional(t.String()),
      }),
    }
  );
