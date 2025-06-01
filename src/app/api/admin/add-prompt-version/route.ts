import { NextRequest, NextResponse } from "next/server";
import { addPromptVersion } from "@/lib/admin-prompt-utils";
import { PromptType } from "@/types/admin-prompts";

// Basic Admin Auth Check (Replace with more robust auth in production)
/* // Commenting out unused placeholder function
async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
  // For MVP, this is a placeholder. In a real app, you'd check a session/token.
  // This demo version doesn't implement full auth for this specific route yet,
  // relying on the client-side login to gate access to the admin UI calling this.
  // A simple check could be added here (e.g., a secret header) if needed for basic protection.
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = req.headers.get("X-Admin-Password"); // Example: client sends password in header
  
  if (!adminPassword || !providedPassword || providedPassword !== adminPassword) {
    // To make it somewhat secure for now, let's check against ADMIN_PASSWORD via a header
    // This is NOT secure for production but better than nothing for an internal tool MVP.
    // The client would need to be updated to send this header after login.
    // For now, let's assume if the call is made, it implies some prior auth on client.
    // To enable actual check: uncomment the error below and ensure client sends header.
    // console.warn("Admin action attempt without valid X-Admin-Password header or mismatch.");
    // return false; 
  }
  return true; // Placeholder - assumes client has handled login.
}
*/

export async function POST(req: NextRequest) {
  // Basic Auth - replace with proper session/token validation in a real app
  // const isAuthenticated = await isAdminAuthenticated(req);
  // if (!isAuthenticated) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const body = await req.json();
    const { promptType, content, changeDescription } = body;

    if (
      !promptType ||
      !Object.values(PromptType).includes(promptType as PromptType)
    ) {
      return NextResponse.json(
        { error: "Invalid prompt type specified." },
        { status: 400 }
      );
    }
    if (typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Prompt content cannot be empty." },
        { status: 400 }
      );
    }
    if (
      typeof changeDescription !== "string" ||
      changeDescription.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Change description cannot be empty." },
        { status: 400 }
      );
    }

    const newVersion = addPromptVersion(
      promptType as PromptType,
      content,
      changeDescription
    );
    return NextResponse.json({ success: true, newVersion });
  } catch (error) {
    console.error("Error adding new prompt version:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to add new prompt version.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
