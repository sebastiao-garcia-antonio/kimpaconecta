import { NextResponse } from "next/server";
import { AssessmentsRepository } from "@/features/assessments/repositories/assessments.repository";

export async function POST(request: Request) {
  try {
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
