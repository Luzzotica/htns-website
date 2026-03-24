import { createOrUpdateGhlContact } from "@/lib/ghl";
import { NextResponse } from "next/server";
import { emailSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.flatten().fieldErrors.email?.[0] ?? "Invalid email",
        },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    await createOrUpdateGhlContact(email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Subscribe] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}
