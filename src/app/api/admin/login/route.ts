"/use client"; // Intentionally incorrect to make it a server component first for env var access

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is not set.");
    return NextResponse.json(
      { error: "Admin authentication not configured." },
      { status: 500 }
    );
  }

  try {
    const { password } = await req.json();
    if (password === adminPassword) {
      // In a real app, set a secure, httpOnly cookie or session token here.
      // For MVP, we'll rely on the client to store a success flag.
      return NextResponse.json({ success: true, message: "Login successful" });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
