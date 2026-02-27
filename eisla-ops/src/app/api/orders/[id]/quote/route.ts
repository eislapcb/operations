import { NextResponse } from "next/server";
import { generateQuote } from "@/lib/actions/orders";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await generateQuote(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
