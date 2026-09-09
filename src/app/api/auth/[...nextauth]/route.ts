import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const res = await handlers.GET(request);
    return res;
  } catch (error) {
    console.error("Erro no GET /api/auth:", error);
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const res = await handlers.POST(request);
    return res;
  } catch (error) {
    console.error("Erro no POST /api/auth:", error);
    return new Response(JSON.stringify({ error: "Credenciais inválidas ou erro no servidor" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
