import { NextRequest, NextResponse } from "next/server";
import {
  interpretInstruction,
  type ProjectContext,
} from "@/lib/ai/interpret";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      instruction?: string;
      context?: ProjectContext;
    };

    if (!body.instruction || typeof body.instruction !== "string") {
      return NextResponse.json(
        { error: "Missing 'instruction' field" },
        { status: 400 },
      );
    }

    if (!body.context) {
      return NextResponse.json(
        { error: "Missing 'context' field" },
        { status: 400 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local." },
        { status: 501 },
      );
    }

    const chain = await interpretInstruction(body.instruction, body.context);
    return NextResponse.json({ data: chain });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI interpretation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
