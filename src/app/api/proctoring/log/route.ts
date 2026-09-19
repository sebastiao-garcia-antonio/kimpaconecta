import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AssessmentsRepository } from "@/features/assessments/repositories/assessments.repository";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { idTentativa, tipoEvento, descricao } = await request.json();
    
    if (!idTentativa || !tipoEvento || !descricao) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log = await AssessmentsRepository.registrarLogSeguranca(
      Number(idTentativa),
      tipoEvento,
      descricao
    );

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
