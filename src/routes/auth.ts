import { Elysia, t } from "elysia";
import { db } from "../db";
import { users, verificationCodes } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "../lib/sendgrid";

// Helper function to generate 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  // Register with Email Verification
  .post(
    "/register",
    async ({ body, set }) => {
      const { username, email, password, firstName, lastName } = body;

      // Check if username exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUser) {
        set.status = 400;
        return { success: false, message: "Username already exists" };
      }

      // Generate 6-digit verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      try {
        // Store verification code
        await db.insert(verificationCodes).values({
          email,
          code,
          expiresAt,
        });

        // Send verification email
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
        username: t.String(),
        email: t.String(),
        password: t.String(),
        firstName: t.String(),
        lastName: t.String(),
      }),
    }
  )

  // Verify Email and Create Account
  .post(
    "/verify-email",
    async ({ body, set }) => {
      const { email, code, username, password, firstName, lastName } = body;

      // Find valid verification code
      const verification = await db.query.verificationCodes.findFirst({
        where: and(
          eq(verificationCodes.email, email),
          eq(verificationCodes.code, code),
          gt(verificationCodes.expiresAt, new Date())
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
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user account
        const [newUser] = await db
          .insert(users)
          .values({
            username,
            password: hashedPassword,
            firstName,
            lastName,
            role: "User",
            isActive: true,
            profileCompleted: false,
            mustChangePassword: false,
          })
          .returning();

        // Delete used verification code
        await db
          .delete(verificationCodes)
          .where(eq(verificationCodes.id, verification.id));

        // Generate token
        const token = Buffer.from(
          `${newUser.id}:${newUser.username}:${Date.now()}`
        ).toString("base64");

        return {
          success: true,
          message: "Account created successfully",
          data: {
            user: {
              id: newUser.id,
              username: newUser.username,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              role: newUser.role,
              profileCompleted: newUser.profileCompleted,
            },
            token: token,
          },
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to create account",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        code: t.String(),
        username: t.String(),
        password: t.String(),
        firstName: t.String(),
        lastName: t.String(),
      }),
    }
  )

  // Resend Verification Code
  .post(
    "/resend-code",
    async ({ body, set }) => {
      const { email } = body;

      // Generate new code
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

        // Send verification email
        await sendVerificationEmail(email, code);

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
            role: user.role,
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
  );
