import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export const authRoutes = new Elysia({ prefix: "/auth" })
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

      // Verify password (support both bcrypt and plain text for migration)
      let passwordMatch = false;
      
      // Check if password is hashed (bcrypt hashes start with $2b$)
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        // Bcrypt hashed password
        passwordMatch = await bcrypt.compare(password, user.password);
      } else {
        // Plain text password (old users)
        passwordMatch = user.password === password;
        
        // If login successful, upgrade to bcrypt
        if (passwordMatch) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await db.update(users)
            .set({ password: hashedPassword })
            .where(eq(users.id, user.id));
        }
      }
      
      if (!passwordMatch) {
        set.status = 401;
        return { success: false, message: "Invalid credentials" };
      }

      if (!user.isActive) {
        set.status = 403;
        return { success: false, message: "Account is inactive" };
      }

      // Generate simple token (in production, use JWT)
      const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64');

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
  )

  // Register (Public - User role only, but accepts role parameter for admin/officer creation)
  .post(
    "/register",
    async ({ body, set }) => {
      const { username, password, firstName, lastName, role } = body;

      // Check if username exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUser) {
        set.status = 400;
        return { success: false, message: "Username already exists" };
      }

      // Hash password with bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Use provided role or default to "User" for public registration
      const userRole = role || "User";
      
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          firstName,
          lastName,
          role: userRole,
          isActive: true,
          profileCompleted: false,
          mustChangePassword: false,
        })
        .returning();

      // Generate token
      const token = Buffer.from(`${newUser.id}:${newUser.username}:${Date.now()}`).toString('base64');

      return {
        success: true,
        message: "Registration successful",
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
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
        firstName: t.String(),
        lastName: t.String(),
        role: t.Optional(t.String()),
      }),
    }
  )
  
  // Update User Profile (Profile Photo & Completion)
  .put(
    "/profile/:userId",
    async ({ params, body, set }) => {
      try {
        const userId = parseInt(params.userId);
        const { profilePhotoUri, profileCompleted } = body;

        // Update user profile
        const [updatedUser] = await db
          .update(users)
          .set({
            profilePhotoUri: profilePhotoUri,
            profileCompleted: profileCompleted ?? true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId))
          .returning();

        if (!updatedUser) {
          set.status = 404;
          return {
            success: false,
            message: "User not found",
          };
        }

        return {
          success: true,
          message: "Profile updated successfully",
          user: updatedUser,
        };
      } catch (error: any) {
        set.status = 500;
        return {
          success: false,
          message: "Failed to update profile",
          error: error.message,
        };
      }
    },
    {
      body: t.Object({
        profilePhotoUri: t.String(),
        profileCompleted: t.Optional(t.Boolean()),
      }),
    }
  );
