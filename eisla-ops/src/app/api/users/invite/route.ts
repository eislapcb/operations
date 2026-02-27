import { NextResponse } from "next/server";
import { inviteUser } from "@/lib/actions/users";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await inviteUser(formData);
    return NextResponse.json({ passphrase: result.passphrase });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
