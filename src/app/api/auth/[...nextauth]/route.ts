import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    return await handlers.GET(request);
  } catch (error: any) {
    console.error("Erro no GET /api/auth/[...nextauth]:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    return await handlers.POST(request);
  } catch (error: any) {
    console.error("Erro no POST /api/auth/[...nextauth]:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
