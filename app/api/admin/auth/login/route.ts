import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConnected } from "@/lib/prisma";
import { verifyPassword, signAdminToken, ADMIN_COOKIE_NAME, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    let adminUser = null;
    let isPasswordValid = false;

    // 1. Try PostgreSQL via Prisma
    const isDbUp = await isDatabaseConnected();
    if (isDbUp) {
      try {
        adminUser = await prisma.admin.findUnique({
          where: { email: normalizedEmail },
        });

        if (adminUser) {
          isPasswordValid = await verifyPassword(password, adminUser.passwordHash);
        }
      } catch (err) {
        console.warn("Prisma admin query fallback:", err);
      }
    }

    // 2. Default Admin Fallback (works out-of-the-box before DB seeding)
    const defaultEmail = (process.env.ADMIN_DEFAULT_EMAIL || "admin@teabox.com").toLowerCase();
    const defaultPass = process.env.ADMIN_DEFAULT_PASSWORD || "adminTeabox2026!";

    if (!adminUser && normalizedEmail === defaultEmail) {
      if (password === defaultPass) {
        isPasswordValid = true;
        adminUser = {
          id: "adm_default_teabox_2026",
          email: defaultEmail,
          name: "Teabox Master Admin",
          role: "SUPER_ADMIN",
          passwordHash: "",
          avatar: null,
          isActive: true,
          lastLoginAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // If DB is connected, automatically persist this admin
        if (isDbUp) {
          try {
            const pwdHash = await hashPassword(defaultPass);
            await prisma.admin.upsert({
              where: { email: defaultEmail },
              update: { lastLoginAt: new Date() },
              create: {
                email: defaultEmail,
                name: "Teabox Master Admin",
                role: "SUPER_ADMIN",
                passwordHash: pwdHash,
              },
            });
          } catch (e) {
            // ignore
          }
        }
      }
    }

    if (!adminUser || !isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid admin email or password" },
        { status: 401 }
      );
    }

    // 3. Sign JWT Token
    const token = await signAdminToken({
      adminId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    });

    // 4. Set HttpOnly Cookie
    const response = NextResponse.json({
      status: "success",
      message: "Admin authentication successful",
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
