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

  let passwordPayload;
  try {
    passwordPayload = await req.json();
  } catch (jsonParseError) {
    console.error("Admin login: Invalid JSON in request body", jsonParseError);
    return NextResponse.json(
      { success: false, error: "Invalid request format. Expected JSON." },
      { status: 400 }
    );
  }

  try {
    const { password } = passwordPayload;
    if (typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password must be a string." },
        { status: 400 }
      );
    }

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
  } catch (processingError) {
    console.error(
      "Admin login: Unexpected error processing login request",
      processingError
    );
    let errorMessage = "An unexpected error occurred during login.";
    if (
      processingError instanceof Error &&
      process.env.NODE_ENV === "development"
    ) {
      // Provide more details in development, but not in production for security.
      errorMessage = processingError.message;
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}