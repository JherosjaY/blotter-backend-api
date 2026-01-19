import { Elysia, t } from "elysia";
import { db } from "../db";
import { users, verificationCodes } from "../db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/sendgrid";
import { verifyCaptcha } from "../lib/captcha";

// Helper function to generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  // Register with Email Verification (Partial Registration)
  .post(
    "/register",
    async ({ body, set }) => {
      const { username, email, password, captchaToken } = body;

      // Verify CAPTCHA first
      const captchaResult = await verifyCaptcha(captchaToken);
      if (!captchaResult.success) {
        set.status = 400;
        return {
          success: false,
          message: captchaResult.message || "CAPTCHA verification failed. Please try again.",
        };
      }

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
        captchaToken: t.String(),
      }),
    }
  )

  // Verify Email and Activate Account
  .post(
    "/verify-email",
    async ({ body, set }) => {
      const { email, code } = body;
      console.log(`🔍 Verify-email request: email=${email}, code=${code}`);

      // Find valid verification code (not expired and not yet used)
      const verification = await db.query.verificationCodes.findFirst({
        where: and(
          eq(verificationCodes.email, email),
          eq(verificationCodes.code, code),
          gt(verificationCodes.expiresAt, new Date()),
          isNull(verificationCodes.verifiedAt) // Only unused codes
        ),
      });

      console.log(`🔍 Verification lookup result:`, verification ? `Found code ${verification.code}, expires at ${verification.expiresAt}` : 'NOT FOUND');

      if (!verification) {
        console.log(`❌ Verification failed: code not found or expired`);
        set.status = 400;
        return {
          success: false,
          message: "Invalid or expired verification code",
        };
      }

      try {
        console.log(`🔍 Looking for user with email: ${email}`);
        // ✅ Find user by email (now that email field exists in users table)
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          console.log(`❌ User not found for email: ${email}`);
          set.status = 404;
          return {
            success: false,
            message: "User not found",
          };
        }
        console.log(`✅ Found user: ${user.username} (ID: ${user.id})`);


        // Activate user account (email verified)
        console.log(`🔄 Activating user account...`);
        const [updatedUser] = await db
          .update(users)
          .set({
            isActive: true, // Activate account
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();
        console.log(`✅ User activated successfully`);


        // ✅ Mark code as verified instead of deleting it
        console.log(`🔄 Marking code as verified...`);
        await db
          .update(verificationCodes)
          .set({ verifiedAt: new Date() })
          .where(eq(verificationCodes.id, verification.id));
        console.log(`✅ Code marked as verified`);


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


      // ✅ PROFESSIONAL PRACTICE: Always generate NEW code on resend
      // Delete any existing codes for this email (valid or expired)
      await db.delete(verificationCodes).where(eq(verificationCodes.email, email));

      // Generate fresh verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store new verification code
      await db.insert(verificationCodes).values({
        email,
        code,
        expiresAt,
      });

      console.log(`🆕 Generated new code for ${email}`);

      try {
        // Get username from database for personalized email
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        const username = user?.username;

        // Send verification email with the NEW code
        await sendVerificationEmail(email, code, username);

        return {
          success: true,
          message: "Verification code sent to your email",
          data: {
            email,
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
        email: t.String(),
      }),
    }
  )

  // Login
  .post(
    "/login",
    async ({ body, set }) => {
      const { username, password, captchaToken } = body;

      // Verify CAPTCHA first
      const captchaResult = await verifyCaptcha(captchaToken);
      if (!captchaResult.success) {
        set.status = 400;
        return {
          success: false,
          message: captchaResult.message || "CAPTCHA verification failed. Please try again.",
        };
      }

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
        return {
          success: false,
          message: "Account is inactive. Please verify your email.",
          data: { email: user.email } // ✅ Return email so app can redirect to verification
        };
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
            email: user.email,
            isActive: user.isActive,
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
        captchaToken: t.String(),
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
  )
  // Forgot Password - Send Reset Code
  .post(
    "/forgot-password",
    async ({ body, set }) => {
      const { email } = body;

      try {
        // Check if user exists
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          set.status = 404;
          return { success: false, message: "No account found with this email. Please register first." };
        }

        // Generate reset code
        const code = generateVerificationCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete old reset codes for this email
        await db.delete(verificationCodes).where(eq(verificationCodes.email, email));

        // Store new reset code
        await db.insert(verificationCodes).values({
          email,
          code,
          expiresAt,
        });

        // Send reset email
        await sendPasswordResetEmail(email, code, user.username);

        console.log(`?? Password reset code sent to {email}`);

        return {
          success: true,
          message: "Reset code sent to your email",
          data: {
            email,
            expiresIn: "10 minutes",
          },
        };
      } catch (error) {
        console.error("? Error sending reset code:", error);
        set.status = 500;
        return { success: false, message: "Failed to send reset code" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
      }),
    }
  )

  // Verify Reset Code
  .post(
    "/verify-reset-code",
    async ({ body, set }) => {
      const { email, code } = body;

      try {
        // Find valid reset code
        const resetCode = await db.query.verificationCodes.findFirst({
          where: and(
            eq(verificationCodes.email, email),
            eq(verificationCodes.code, code),
            gt(verificationCodes.expiresAt, new Date()),
            isNull(verificationCodes.verifiedAt)
          ),
        });

        if (!resetCode) {
          set.status = 400;
          return { success: false, message: "Invalid or expired reset code. Please request a new one." };
        }

        console.log(`? Reset code verified for {email}`);

        return {
          success: true,
          message: "Reset code verified",
        };
      } catch (error) {
        console.error("? Error verifying reset code:", error);
        set.status = 500;
        return { success: false, message: "Failed to verify reset code" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        code: t.String(),
      }),
    }
  )

  // Reset Password
  .post(
    "/reset-password",
    async ({ body, set }) => {
      const { email, code, newPassword } = body;

      try {
        // Verify reset code
        const resetCode = await db.query.verificationCodes.findFirst({
          where: and(
            eq(verificationCodes.email, email),
            eq(verificationCodes.code, code),
            gt(verificationCodes.expiresAt, new Date()),
            isNull(verificationCodes.verifiedAt)
          ),
        });

        if (!resetCode) {
          set.status = 400;
          return { success: false, message: "Invalid or expired reset code. Please request a new one." };
        }

        // Get user
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          set.status = 404;
          return { success: false, message: "User not found" };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        // Mark code as used
        await db
          .update(verificationCodes)
          .set({ verifiedAt: new Date() })
          .where(eq(verificationCodes.id, resetCode.id));

        console.log(`? Password reset successfully for {email}`);

        return {
          success: true,
          message: "Password reset successfully",
        };
      } catch (error) {
        console.error("? Error resetting password:", error);
        set.status = 500;
        return { success: false, message: "Failed to reset password" };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        code: t.String(),
        newPassword: t.String(),
      }),
    }
  )

  // Update Tooltip Flag
  .patch(
    "/users/:id/tooltips",
    async ({ params, set }) => {
      const userId = parseInt(params.id);

      try {
        await db.update(users)
          .set({ hasSeenTooltips: true })
          .where(eq(users.id, userId));

        return {
          success: true,
          message: "Tooltip flag updated successfully",
        };
      } catch (error) {
        console.error("❌ Error updating tooltip flag:", error);
        set.status = 500;
        return { success: false, message: "Failed to update tooltip flag" };
      }
    }
  );
