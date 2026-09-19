"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  GraduationCap, Users, Award, ShieldAlert, CheckCircle, 
  Calendar, Plus, Search, FileText, Video, ExternalLink,
  Lock, Unlock, AlertTriangle, Upload, Check, X, ChevronRight, Clock, Clipboard, RefreshCw, BarChart2,
  Briefcase, Bell, Settings, LogOut, BookOpen, AlertCircle, Eye, CheckCircle2, ChevronDown, Trash2, FileSpreadsheet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  criarNovaAvaliacaoServer, 
  lancarPresencasServer, 
  enviarMaterialDidaticoServer, 
  criarReuniaoVirtualServer, 
  atualizarStatusTentativaServer, 
  registrarAdvertenciaTentativaServer,
  autorizarProjetoServer, 
  getDashboardData,
  criarOportunidadeServer,
  atualizarEstadoCandidaturaServer,
  marcarNotificacaoComoLidaServer,
  criarGrupoServer,
  adicionarMembroGrupoServer,
  removerMembroGrupoServer,
  eliminarGrupoServer
} from "@/features/academic/actions";

interface ProfessorDashboardClientProps {
  initialData: any;
  professorId: number;
  professorNome: string;
}

export default function ProfessorDashboardClient({ 
  initialData, 
  professorId, 
  professorNome 
}: ProfessorDashboardClientProps) {
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState("overview");
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  // Notification center toggle
  const [showNotifications, setShowNotifications] = useState(false);

  // Search and filter states
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(
    initialData.disciplines?.[0]?.id || null
  );
  const [selectedExamId, setSelectedExamId] = useState<number | null>(
    initialData.evaluations?.[0]?.id || null
  );
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<number | null>(
    initialData.opportunities?.[0]?.idOportunidade || null
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    initialData.groups?.[0]?.id || null
  );

  // Forms states
  const [examTitle, setExamTitle] = useState("");
  const [examInicio, setExamInicio] = useState("");
  const [examFim, setExamFim] = useState("");
  const [examDuracao, setExamDuracao] = useState(60);
  const [examNotaMax, setExamNotaMax] = useState(20);
  const [examQuestoes, setExamQuestoes] = useState<any[]>([
    { enunciado: "", tipoQuestao: "multipla_escolha", alternativas: [{ textoAlternativa: "", isCorreta: true }] }
  ]);

  const [meetingTitulo, setMeetingTitulo] = useState("");
  const [meetingDesc, setMeetingDesc] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingPlataforma, setMeetingPlataforma] = useState("Teams");
  const [meetingInicio, setMeetingInicio] = useState("");
  const [meetingDuracao, setMeetingDuracao] = useState(60);

  const [materialTitulo, setMaterialTitulo] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [materialTipo, setMaterialTipo] = useState("PDF");
  const [materialUrl, setMaterialUrl] = useState("");

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, boolean>>({});

  // Vacancy/Opportunity states
  const [oppTitle, setOppTitle] = useState("");
  const [oppDesc, setOppDesc] = useState("");
  const [oppType, setOppType] = useState("estagio");
  const [oppCompany, setOppCompany] = useState("");
  const [oppReqs, setOppReqs] = useState("");
  const [oppDate, setOppDate] = useState("");

  // Workgroup states
  const [grpName, setGrpName] = useState("");
  const [grpType, setGrpType] = useState("trabalho");
  const [grpDisciplineId, setGrpDisciplineId] = useState<number | null>(
    initialData.disciplines?.[0]?.id || null
  );
  const [newMemberId, setNewMemberId] = useState<number | null>(null);
  const [newMemberRole, setNewMemberRole] = useState("membro");

  // Reload data helper
  const reloadData = async () => {
    const res = await getDashboardData(professorId);
    if (res.success && res.data) {
      setData(res.data);
      if (!selectedDisciplineId && res.data.disciplines?.[0]) {
        setSelectedDisciplineId(res.data.disciplines[0].id);
      }
      if (!selectedExamId && res.data.evaluations?.[0]) {
        setSelectedExamId(res.data.evaluations[0].id);
      }
      if (!selectedOpportunityId && res.data.opportunities?.[0]) {
        setSelectedOpportunityId(Number(res.data.opportunities[0].idOportunidade));
      }
      if (!selectedGroupId && res.data.groups?.[0]) {
        setSelectedGroupId(res.data.groups[0].id);
      }
    }
  };

  // Live monitor polling emulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "proctoring") {
        reloadData();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Sync attendance list with students when discipline changes
  useEffect(() => {
    if (data.students) {
      const records: Record<number, boolean> = {};
      data.students.forEach((s: any) => {
        records[s.id] = true; // default present
      });
      setAttendanceRecords(records);
    }
  }, [selectedDisciplineId, data.students]);

  // Sync member selector when selected group changes
  useEffect(() => {
    if (selectedGroupId && data.students) {
      const currentGroup = data.groups?.find((g: any) => g.id === selectedGroupId);
      const memberIds = currentGroup?.membros?.map((m: any) => m.idUsuario) || [];
      const nonMembers = data.students.filter((s: any) => !memberIds.includes(s.id));
      if (nonMembers.length > 0) {
        setNewMemberId(nonMembers[0].id);
      } else {
        setNewMemberId(null);
      }
    }
  }, [selectedGroupId, data.groups, data.students]);

  // Notification Reader Trigger
  const handleMarkNotificationRead = (id: number) => {
    startTransition(async () => {
      const res = await marcarNotificacaoComoLidaServer(id);
      if (res.success) {
        await reloadData();
      }
    });
  };

  // Opportunity Vacancy Creator Trigger
  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oppTitle || !oppDesc || !oppCompany) {
      addToast("Preencha todos os campos obrigatórios", "error");
      return;
    }

    startTransition(async () => {
      const res = await criarOportunidadeServer({
        titulo: oppTitle,
        descricao: oppDesc,
        tipo: oppType,
        empresa: oppCompany,
        requisitos: oppReqs,
        dataLimite: oppDate || undefined,
        criadoPor: professorId
      });

      if (res.success) {
        addToast("Vaga académica criada com sucesso na vitrine!", "success");
        setOppTitle("");
        setOppDesc("");
        setOppCompany("");
        setOppReqs("");
        setOppDate("");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao criar oportunidade", "error");
      }
    });
  };

  // Candidate Admission Status Tracker
  const handleUpdateCandidacyStatus = (idCand: number, state: string) => {
    startTransition(async () => {
      const res = await atualizarEstadoCandidaturaServer(idCand, state);
      if (res.success) {
        addToast(`Candidatura atualizada para o estado: ${state}`, "success");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao atualizar candidatura", "error");
      }
    });
  };

  // Workgroup Creator Trigger
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grpName || !grpDisciplineId) {
      addToast("Indique o nome do grupo e a disciplina correspondente", "error");
      return;
    }

    startTransition(async () => {
      const res = await criarGrupoServer({
        nomeGrupo: grpName,
        tipoGrupo: grpType,
        idDisciplina: Number(grpDisciplineId),
        idTurma: 1, // default turma 1 (TL001)
        idCriador: professorId
      });

      if (res.success) {
        addToast(`Grupo de ${grpType === "trabalho" ? "Trabalho" : "Mentoria"} criado com sucesso!`, "success");
        setGrpName("");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao criar grupo", "error");
      }
    });
  };

  // Add Group Member Trigger
  const handleAddGroupMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !newMemberId) {
      addToast("Selecione o grupo e o estudante", "error");
      return;
    }

    startTransition(async () => {
      const res = await adicionarMembroGrupoServer(
        Number(selectedGroupId),
        Number(newMemberId),
        newMemberRole
      );

      if (res.success) {
        addToast("Estudante inscrito no grupo de trabalho!", "success");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao adicionar membro", "error");
      }
    });
  };

  // Remove Group Member Trigger
  const handleRemoveGroupMember = (idGrupo: number, idUsuario: number) => {
    startTransition(async () => {
      const res = await removerMembroGrupoServer(idGrupo, idUsuario);
      if (res.success) {
        addToast("Membro removido do grupo.", "info");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao remover membro", "error");
      }
    });
  };

  // Delete Group Trigger
  const handleDeleteGroup = (idGrupo: number) => {
    if (!confirm("Tem a certeza que deseja eliminar este grupo de trabalho permanentemente?")) return;

    startTransition(async () => {
      const res = await eliminarGrupoServer(idGrupo);
      if (res.success) {
        addToast("Grupo eliminado com sucesso.", "info");
        setSelectedGroupId(null);
        await reloadData();
      } else {
        addToast(res.error || "Erro ao eliminar grupo", "error");
      }
    });
  };

  // Exam Creator Trigger
  const handleAddQuestion = () => {
    setExamQuestoes([
      ...examQuestoes,
      { enunciado: "", tipoQuestao: "multipla_escolha", alternativas: [{ textoAlternativa: "", isCorreta: true }] }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setExamQuestoes(examQuestoes.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...examQuestoes];
    updated[index][field] = value;
    setExamQuestoes(updated);
  };

  const handleAlternativaChange = (qIdx: number, aIdx: number, value: string) => {
    const updated = [...examQuestoes];
    updated[qIdx].alternativas[aIdx].textoAlternativa = value;
    setExamQuestoes(updated);
  };

  const handleSetCorrectAlternativa = (qIdx: number, aIdx: number) => {
    const updated = [...examQuestoes];
    updated[qIdx].alternativas = updated[qIdx].alternativas.map((alt: any, idx: number) => ({
      ...alt,
      isCorreta: idx === aIdx
    }));
    setExamQuestoes(updated);
  };

  const handleAddAlternativa = (qIdx: number) => {
    const updated = [...examQuestoes];
    updated[qIdx].alternativas.push({ textoAlternativa: "", isCorreta: false });
    setExamQuestoes(updated);
  };

  const handleRemoveAlternativa = (qIdx: number, aIdx: number) => {
    const updated = [...examQuestoes];
    updated[qIdx].alternativas = updated[qIdx].alternativas.filter((_: any, idx: number) => idx !== aIdx);
    setExamQuestoes(updated);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisciplineId) {
      addToast("Selecione uma disciplina", "error");
      return;
    }
    if (!examTitle || !examInicio || !examFim) {
      addToast("Preencha todos os campos obrigatórios", "error");
      return;
    }

    startTransition(async () => {
      const res = await criarNovaAvaliacaoServer({
        idDisciplina: Number(selectedDisciplineId),
        idProfessor: professorId,
        titulo: examTitle,
        dataInicio: examInicio,
        dataFim: examFim,
        duracaoMinutos: Number(examDuracao),
        notaMaxima: Number(examNotaMax),
        questoes: examQuestoes
      });

      if (res.success) {
        addToast("Nova avaliação criada com sucesso!", "success");
        setExamTitle("");
        setExamInicio("");
        setExamFim("");
        setExamQuestoes([
          { enunciado: "", tipoQuestao: "multipla_escolha", alternativas: [{ textoAlternativa: "", isCorreta: true }] }
        ]);
        await reloadData();
      } else {
        addToast(res.error || "Erro ao criar avaliação", "error");
      }
    });
  };

  // Schedule Meeting Trigger
  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitulo || !meetingLink || !meetingInicio) {
      addToast("Preencha os campos obrigatórios", "error");
      return;
    }

    startTransition(async () => {
      const fimDate = new Date(meetingInicio);
      fimDate.setMinutes(fimDate.getMinutes() + Number(meetingDuracao));

      const res = await criarReuniaoVirtualServer({
        titulo: meetingTitulo,
        descricao: meetingDesc,
        idCriador: professorId,
        linkReuniao: meetingLink,
        plataforma: meetingPlataforma,
        dataInicio: meetingInicio,
        dataFim: fimDate.toISOString()
      });

      if (res.success) {
        addToast("Reunião agendada com sucesso!", "success");
        setMeetingTitulo("");
        setMeetingDesc("");
        setMeetingLink("");
        setMeetingInicio("");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao agendar reunião", "error");
      }
    });
  };

  // Material Uploader Trigger
  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisciplineId) {
      addToast("Selecione uma disciplina", "error");
      return;
    }
    if (!materialTitulo || !materialUrl) {
      addToast("Preencha o título e link do material", "error");
      return;
    }

    startTransition(async () => {
      const res = await enviarMaterialDidaticoServer({
        idDisciplina: Number(selectedDisciplineId),
        idProfessor: professorId,
        titulo: materialTitulo,
        descricao: materialDesc,
        tipoMaterial: materialTipo,
urlArquivo: materialUrl,
});

      if (res.success) {
        addToast("Material didático partilhado com sucesso!", "success");
        setMaterialTitulo("");
        setMaterialDesc("");
        setMaterialUrl("");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao enviar material", "error");
      }
    });
  };

  // Register Attendance Trigger
  const handleSaveAttendance = () => {
    if (!selectedDisciplineId) {
      addToast("Selecione uma disciplina", "error");
      return;
    }
    if (Object.keys(attendanceRecords).length === 0) {
      addToast("Nenhum estudante disponível", "error");
      return;
    }

    startTransition(async () => {
      const records = Object.entries(attendanceRecords).map(([studentId, presente]) => ({
        idUsuario: Number(studentId),
        idDisciplina: Number(selectedDisciplineId),
        dataAula: attendanceDate,
        presente
      }));

      const res = await lancarPresencasServer(records);
      if (res.success) {
        addToast("Presenças salvas com sucesso!", "success");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao lançar presenças", "error");
      }
    });
  };

// Proctoring Ações: Bloquear/Desbloquear
  const handleUpdateAttemptStatus = (idTentativa: number, status: string) => {
    startTransition(async () => {
      const res = await atualizarStatusTentativaServer(idTentativa, status);
      if (res.success) {
        addToast(
          status === "bloqueada" 
            ? "Tentativa de exame bloqueada pelo professor." 
            : "Tentativa de exame restaurada com sucesso.",
          status === "bloqueada" ? "error" : "success"
        );
        await reloadData();
      } else {
        addToast(res.error || "Erro ao alterar estado", "error");
      }
    });
  };

  // Proctoring Ações: Advertir estudante
  const handleAdvertirEstudante = (idTentativa: number, estudanteNome?: string) => {
    startTransition(async () => {
      const res = await registrarAdvertenciaTentativaServer(idTentativa, estudanteNome || "estudante");
      if (res.success) {
        addToast(`Advertência registada para ${estudanteNome || "o estudante"}.`, "success");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao registar advertência", "error");
      }
    });
  };

  // Project Approval Trigger
  const handleAuthorizeProject = (idProjeto: number) => {
    startTransition(async () => {
      const res = await autorizarProjetoServer(idProjeto, professorId);
      if (res.success) {
        addToast("Projeto autorizado na vitrine pública oficial!", "success");
        await reloadData();
      } else {
        addToast(res.error || "Erro ao aprovar projeto", "error");
      }
    });
  };

  // Derived metrics counts
  const totalDisciplines = data.disciplines?.length || 0;
  const totalStudents = data.students?.length || 0;
  const activeExams = data.evaluations?.filter((e: any) => {
    const agora = new Date();
    return new Date(e.dataInicio) <= agora && new Date(e.dataFim) >= agora;
  }) || [];
const proctoringAlerts = data.evaluations?.flatMap((e: any) => e.tentativas || [])
    .filter((t: any) => t.statusTentativa === "em_curso" && t.monitoramento?.nivelSuspeita === "alto") || [];

  const cursosDistintos = new Set(data.disciplines?.map((d: any) => d.cursoNome).filter(Boolean)).size || 0;
  const turmasDistintas = new Set(data.students?.map((s: any) => s.turmaNome).filter(Boolean)).size || 0;

  const unreadNotifications = data.notifications?.filter((n: any) => !n.lida) || [];

  // Grade Analytics Calculations
  const getExamAnalytics = () => {
    const selected = data.evaluations?.find((e: any) => e.id === selectedExamId);
    if (!selected || !selected.tentativas || selected.tentativas.length === 0) return null;

    const scores: number[] = selected.tentativas
      .filter((t: any) => t.statusTentativa === "submetida" && t.notaObtida !== null)
      .map((t: any) => Number(t.notaObtida));

    if (scores.length === 0) return null;

    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    const approvedCount = scores.filter(s => s >= 10).length;
    const approvalRate = (approvedCount / scores.length) * 100;

    // Distribution groups
    const dist = {
      "0-4": scores.filter(s => s < 5).length,
      "5-9": scores.filter(s => s >= 5 && s < 10).length,
      "10-13": scores.filter(s => s >= 10 && s < 14).length,
      "14-16": scores.filter(s => s >= 14 && s < 17).length,
      "17-20": scores.filter(s => s >= 17).length
    };

    return { maxScore, minScore, avgScore, approvalRate, dist, total: scores.length };
  };

  const analytics = getExamAnalytics();

  // Find non-members for currently selected group
  const getNonMembersForSelectedGroup = () => {
    if (!selectedGroupId || !data.students) return [];
    const currentGroup = data.groups?.find((g: any) => g.id === selectedGroupId);
    const memberIds = currentGroup?.membros?.map((m: any) => m.idUsuario) || [];
    return data.students.filter((s: any) => !memberIds.includes(s.id));
  };

  const nonMembers = getNonMembersForSelectedGroup();

  return (
    <div className="text-slate-800 font-sans bg-slate-50">

        {/* TOP BAR */}
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white/80 backdrop-blur-sm z-20 shrink-0">
          <div>
            <h2 className="text-base font-extrabold tracking-tight capitalize text-slate-800">
              {activeTab === "overview" && "Painel Geral"}
              {activeTab === "classes" && "Gestão de Disciplinas & Chamadas"}
              {activeTab === "exams" && "Exames e Auditoria de Notas"}
              {activeTab === "groups" && "Estágios & Grupos de Estudo"}
              {activeTab === "proctoring" && "Monitor de Proctoring Anti-Fraude"}
              {activeTab === "opportunities" && "Oportunidades de Carreiras Académicas"}
              {activeTab === "projects" && "Autorização de Projetos Universitários"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Bell Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition relative"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-slate-800 font-extrabold text-[9px] h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 divide-y divide-slate-900">
                  <div className="flex items-center justify-between pb-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Notificações</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-500 hover:text-slate-350 text-xs"
                    >
                      Fechar
                    </button>
                  </div>
                  <div className="pt-2 max-h-[300px] overflow-y-auto space-y-2.5">
                    {unreadNotifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">Nenhuma notificação por ler.</p>
                    ) : (
                      unreadNotifications.map((notif: any) => {
                        const isHigh = notif.prioridade === "alta";
                        return (
                          <div key={notif.idNotificacao} className="text-xs p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 flex gap-2">
                            {isHigh ? <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" /> : <Bell className="h-4 w-4 text-brand-green shrink-0 mt-0.5" />}
                            <div className="flex-1">
                              <h5 className="font-bold text-slate-700">{notif.titulo}</h5>
                              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{notif.mensagem}</p>
                              <button
                                onClick={() => handleMarkNotificationRead(notif.idNotificacao)}
                                className="text-[10px] text-brand-blue hover:underline mt-2 font-bold"
                              >
                                Marcar como lida
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={reloadData}
              disabled={isPending}
              className="p-2 border border-slate-200 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition disabled:opacity-50"
              title="Sincronizar Dados"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${isPending ? "animate-spin" : ""}`} />
            </button>

          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Top metrics summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:bg-white transition duration-300 relative group overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-brand-blue/10 to-transparent rounded-full filter blur-xl group-hover:scale-125 transition duration-300"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cursos & Disciplinas</p>
                      <h3 className="text-3xl font-extrabold mt-2 text-slate-800">{totalDisciplines}</h3>
                    </div>
                    <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-xl">
                      <BookOpen className="h-5 w-5" />
                    </div>
                  </div>
<p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase">{cursosDistintos} curso(s) associado(s)</p>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:bg-white transition duration-300 relative group overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-brand-green/10 to-transparent rounded-full filter blur-xl group-hover:scale-125 transition duration-300"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Alunos Inscritos</p>
                      <h3 className="text-3xl font-extrabold mt-2 text-slate-800">{totalStudents}</h3>
                    </div>
                    <div className="p-3 bg-brand-green/10 text-brand-green rounded-xl">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase">{turmasDistintas} turma(s) vinculada(s)</p>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:bg-white transition duration-300 relative group overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-red-600/10 to-transparent rounded-full filter blur-xl group-hover:scale-125 transition duration-300"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Alertas Suspeitos</p>
                      <h3 className={`text-3xl font-extrabold mt-2 ${proctoringAlerts.length > 0 ? "text-red-400 animate-pulse" : "text-emerald-500"}`}>{proctoringAlerts.length}</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${proctoringAlerts.length > 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-500"}`}>
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase">Monitores de exame ativos</p>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:bg-white transition duration-300 relative group overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-amber-600/10 to-transparent rounded-full filter blur-xl group-hover:scale-125 transition duration-300"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Reputação de Mentoria</p>
                      <h3 className="text-3xl font-extrabold mt-2 text-amber-400">{data.reputacao?.pontos || 0} pts</h3>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                      <Award className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase capitalize">Rank: {data.reputacao?.nivel || "iniciante"}</p>
                </div>
              </div>

              {/* Central overview grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side actions and upcoming classes */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Quick features board */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Ações Académicas Rápidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button 
                        onClick={() => setActiveTab("exams")}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-brand-blue/40 transition duration-200"
                      >
                        <div className="p-2.5 bg-brand-blue/10 text-brand-blue rounded-lg w-fit mb-3">
                          <Plus className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="font-bold text-xs text-slate-700">Criar Novo Exame</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Configurar banco de dados de questões</p>
                      </button>

                      <button 
                        onClick={() => setActiveTab("classes")}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-brand-green/40 transition duration-200"
                      >
                        <div className="p-2.5 bg-brand-green/10 text-brand-green rounded-lg w-fit mb-3">
                          <Clipboard className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="font-bold text-xs text-slate-700">Registrar Presença</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Diário de aula e chamada</p>
                      </button>

                      <Link 
                        href="/professor/pautas"
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-emerald-500/40 transition duration-200 block"
                      >
                        <div className="p-2.5 bg-emerald-600/10 text-emerald-600 rounded-lg w-fit mb-3">
                          <FileSpreadsheet className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="font-bold text-xs text-slate-700">Pautas & Relatórios</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Baixar Excel ou Imprimir PDF</p>
                      </Link>
                    </div>
                  </div>

                  {/* Virtual classes scheduler */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Agendar Aula Virtual</h3>
                    <form onSubmit={handleCreateMeeting} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assunto da Aula</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Teoria de Grafos e Estrutura de Dados"
                          value={meetingTitulo}
                          onChange={(e) => setMeetingTitulo(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Data e Hora</label>
                        <input 
                          type="datetime-local"
                          value={meetingInicio}
                          onChange={(e) => setMeetingInicio(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Plataforma</label>
                        <select 
                          value={meetingPlataforma}
                          onChange={(e) => setMeetingPlataforma(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        >
                          <option value="Teams">Microsoft Teams</option>
                          <option value="Zoom">Zoom Meeting</option>
                          <option value="Meet">Google Meet</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Link de Acesso</label>
                        <input 
                          type="url" 
                          placeholder="https://teams.microsoft.com/l/..."
                          value={meetingLink}
                          onChange={(e) => setMeetingLink(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <button
                          type="submit"
                          disabled={isPending}
                          className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs px-4 py-2 rounded-xl transition duration-150 shadow-sm"
                        >
                          {isPending ? "A agendar..." : "Agendar Aula"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right side upcoming schedule & reputation */}
                <div className="space-y-8">
                  {/* Virtual classes scheduled list */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Agenda Académica</h3>
                    {data.meetings?.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">Nenhum evento agendado.</p>
                    ) : (
                      <div className="space-y-3.5">
                        {data.meetings?.slice(0, 3).map((meeting: any) => (
                          <div key={meeting.idReuniao} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex gap-3">
                            <div className="p-2 bg-brand-green/10 text-brand-green h-fit rounded-lg">
                              <Video className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-xs text-slate-700 truncate">{meeting.titulo}</h5>
                              <span className="text-[10px] text-slate-450 mt-1 block">
                                {new Date(meeting.dataInicio).toLocaleString("pt-PT")}
                              </span>
                              <a 
                                href={meeting.linkReuniao}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-blue hover:underline mt-2.5"
                              >
                                Abrir Link <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reputation progress stats */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl bg-gradient-to-b from-slate-950/40 to-brand-blue-dark/10">
                    <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Award className="h-4.5 w-4.5" /> Estatuto de Carreira
                    </h3>
                    <div className="space-y-4 pt-1">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Mentorias Realizadas:</span>
                          <span className="font-bold text-slate-700">{data.reputacao?.mentoriasRealizadas || 0} / 5</span>
                        </div>
                        <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-brand-blue-light h-full rounded-full" 
                            style={{ width: `${Math.min(((data.reputacao?.mentoriasRealizadas || 0) / 5) * 105, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Projetos Orientados:</span>
                          <span className="font-bold text-slate-700">{data.reputacao?.projetosPublicados || 0} / 3</span>
                        </div>
                        <div className="w-full bg-slate-50 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-brand-green h-full rounded-full" 
                            style={{ width: `${Math.min(((data.reputacao?.projetosPublicados || 0) / 3) * 105, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Votos de Confiança:</span>
                          <span className="font-bold text-slate-700">{data.reputacao?.feedbackPositivo || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Disciplines & Attendance */}
          {activeTab === "classes" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Disciplines select options */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Escolher Disciplina</h3>
                {data.disciplines?.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhuma disciplina na base de dados.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {data.disciplines?.map((disc: any) => (
                      <button
                        key={disc.id}
                        onClick={() => setSelectedDisciplineId(disc.id)}
                        className={`p-5 border rounded-xl text-left transition duration-200 flex flex-col justify-between ${
                          selectedDisciplineId === disc.id
                            ? "border-brand-blue bg-brand-blue/5"
                            : "border-slate-200 hover:bg-slate-50/40"
                        }`}
                      >
                        <div>
                          <span className="text-[10px] bg-slate-850 text-slate-350 font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">Semestre {disc.semestre}º</span>
                          <h4 className="font-bold text-sm text-slate-700 mt-3">{disc.nomeDisciplina}</h4>
                          <p className="text-[11px] text-slate-500 mt-1">{disc.cursoNome || "Curso não associado"}</p>
                        </div>
                        <div className="mt-6 flex justify-between items-center text-xs text-slate-500 border-t border-slate-200/60 pt-4">
                          <span>{disc.alunosCount} Alunos Inscritos</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedDisciplineId && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Table checklist for students */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h4 className="font-bold text-sm text-slate-700">Chamada Académica Diária</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Validação de presenças dos alunos</p>
                      </div>
                      <input 
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="px-3 py-1.5 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600"
                      />
                    </div>

                    {data.students?.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-10">Sem alunos inscritos na turma.</p>
                    ) : (
                      <div className="mb-6 overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-[560px] text-left text-xs">
                          <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="p-4">Estudante</th>
                              <th className="p-4">Nº Matrícula</th>
                              <th className="p-4 text-center">Presença</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {data.students?.map((student: any) => (
                              <tr key={student.id} className="hover:bg-slate-50/20">
                                <td className="p-4 font-bold text-slate-700">{student.nome}</td>
                                <td className="p-4 text-slate-455 font-mono">{student.numProcesso}</td>
                                <td className="p-4 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={attendanceRecords[student.id] ?? true}
                                    onChange={(e) => setAttendanceRecords({
                                      ...attendanceRecords,
                                      [student.id]: e.target.checked
                                    })}
                                    className="h-4.5 w-4.5 rounded border-slate-200 text-brand-blue bg-white focus:ring-brand-blue cursor-pointer"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="text-right">
                      <button
                        onClick={handleSaveAttendance}
                        disabled={isPending}
                        className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs px-5 py-2.5 rounded-xl transition duration-150 shadow-sm"
                      >
                        {isPending ? "A gravar..." : "Confirmar Presenças"}
                      </button>
                    </div>
                  </div>

                  {/* Share material */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl h-fit">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-brand-green" /> Partilhar Material Didático
                    </h3>
                    <form onSubmit={handleUploadMaterial} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nome do Arquivo</label>
                        <input
                          type="text"
                          placeholder="Ex: Introdução ao C++ e Sockets"
                          value={materialTitulo}
                          onChange={(e) => setMaterialTitulo(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descrição</label>
                        <textarea
                          rows={2}
                          placeholder="Ex: Slides explicativos da primeira frequência."
                          value={materialDesc}
                          onChange={(e) => setMaterialDesc(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Formato</label>
                        <select
                          value={materialTipo}
                          onChange={(e) => setMaterialTipo(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        >
                          <option value="PDF">Ficheiro PDF</option>
                          <option value="ZIP">Arquivo ZIP / Code</option>
                          <option value="Slides">Slides PPTX</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">URL do Ficheiro</label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={materialUrl}
                          onChange={(e) => setMaterialUrl(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition duration-150"
                      >
                        {isPending ? "A enviar..." : "Disponibilizar aos Alunos"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Exams & Analytics */}
          {activeTab === "exams" && (
            <div className="space-y-8 animate-fadeIn">

              {/* Grade distribution charts */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Métricas de Aproveitamento do Exame</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Gráficos de auditoria e distribuição de avaliações</p>
                  </div>
                  <select
                    value={selectedExamId || ""}
                    onChange={(e) => setSelectedExamId(Number(e.target.value))}
                    className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600"
                  >
                    <option value="" disabled>Escolher prova...</option>
                    {data.evaluations?.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.titulo}</option>
                    ))}
                  </select>
                </div>

                {!analytics ? (
                  <p className="text-xs text-slate-500 text-center py-10">Nenhum dado analítico disponível. Sem exames submetidos e corrigidos.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Big Stats */}
                    <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Nota Média</span>
                        <h4 className="text-2xl font-extrabold text-brand-blue mt-1">{analytics.avgScore.toFixed(1)}</h4>
                        <span className="text-[9px] text-slate-550 block mt-1">Valores</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Taxa de Aprov.</span>
                        <h4 className="text-2xl font-extrabold text-emerald-400 mt-1">{analytics.approvalRate.toFixed(0)}%</h4>
                        <span className="text-[9px] text-slate-550 block mt-1">Notas {'>'}= 10</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider">Maior Nota</span>
                        <h4 className="text-2xl font-extrabold text-blue-400 mt-1">{analytics.maxScore.toFixed(1)}</h4>
                        <span className="text-[9px] text-slate-550 block mt-1">Máximo 20.0</span>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <span className="text-[10px] text-slate-455 uppercase font-bold tracking-wider">Menor Nota</span>
                        <h4 className="text-2xl font-extrabold text-red-400 mt-1">{analytics.minScore.toFixed(1)}</h4>
                        <span className="text-[9px] text-slate-550 block mt-1">Mínimo 0.0</span>
                      </div>
                    </div>

                    {/* Bar Chart Representation (Rigor in custom CSS graph) */}
                    <div className="lg:col-span-3 bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4">
                      <h4 className="font-bold text-xs text-slate-350 uppercase tracking-widest mb-4">Curva de Distribuição de Notas</h4>
                      <div className="flex h-40 items-end justify-between gap-4 pt-4 border-b border-slate-200 px-4">
                        {Object.entries(analytics.dist).map(([range, count]) => {
                          const percentage = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                          return (
                            <div key={range} className="flex-1 flex flex-col items-center group">
                              <div className="text-[10px] font-bold text-brand-blue mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {count} {count === 1 ? "aluno" : "alunos"} ({percentage.toFixed(0)}%)
                              </div>
                              <div 
                                className="w-full bg-gradient-to-t from-brand-blue to-brand-green rounded-t-lg transition-all duration-500 ease-out hover:opacity-90"
                                style={{ height: `${Math.max(percentage * 1.2, 8)}px` }}
                              ></div>
                              <span className="text-[10px] text-slate-450 mt-2 font-semibold uppercase">{range}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Exam */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="h-4.5 w-4.5 text-brand-blue" /> Configurar Nova Avaliação
                  </h3>
                  <form onSubmit={handleCreateExam} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Título do Exame</label>
                        <input
                          type="text"
                          placeholder="Ex: Primeira Frequência de Arquitetura de Computadores"
                          value={examTitle}
                          onChange={(e) => setExamTitle(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Início do Acesso</label>
                        <input
                          type="datetime-local"
                          value={examInicio}
                          onChange={(e) => setExamInicio(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Fim do Acesso</label>
                        <input
                          type="datetime-local"
                          value={examFim}
                          onChange={(e) => setExamFim(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Duração (Minutos)</label>
                        <input
                          type="number"
                          value={examDuracao}
                          onChange={(e) => setExamDuracao(Number(e.target.value))}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nota Máxima</label>
                        <input
                          type="number"
                          value={examNotaMax}
                          onChange={(e) => setExamNotaMax(Number(e.target.value))}
                          className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-200/60 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-xs text-slate-330 uppercase tracking-widest">Adicionar Questões</h4>
                        <button
                          type="button"
                          onClick={handleAddQuestion}
                          className="text-[11px] font-bold text-brand-blue hover:underline flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar Pergunta
                        </button>
                      </div>

                      <div className="space-y-6">
                        {examQuestoes.map((quest, qIdx) => (
                          <div key={qIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] font-bold bg-slate-850 px-2.5 py-0.5 rounded-lg text-slate-600">Questão {qIdx + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qIdx)}
                                disabled={examQuestoes.length === 1}
                                className="text-slate-500 hover:text-red-400 disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Pergunta</label>
                              <textarea
                                rows={2}
                                value={quest.enunciado}
                                onChange={(e) => handleQuestionChange(qIdx, "enunciado", e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                              />
                            </div>

                            {quest.tipoQuestao === "multipla_escolha" && (
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Respostas de Opção</label>
                                  <button
                                    type="button"
                                    onClick={() => handleAddAlternativa(qIdx)}
                                    className="text-[10px] font-bold text-brand-green hover:underline"
                                  >
                                    Adicionar Opção
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {quest.alternativas.map((alt: any, aIdx: number) => (
                                    <div key={aIdx} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`quest-${qIdx}-correct`}
                                        checked={alt.isCorreta}
                                        onChange={() => handleSetCorrectAlternativa(qIdx, aIdx)}
                                        className="h-4 w-4 text-brand-blue bg-white border-slate-200 cursor-pointer"
                                      />
                                      <input
                                        type="text"
                                        placeholder={`Alternativa ${aIdx + 1}`}
                                        value={alt.textoAlternativa}
                                        onChange={(e) => handleAlternativaChange(qIdx, aIdx, e.target.value)}
                                        className="flex-1 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveAlternativa(qIdx, aIdx)}
                                        disabled={quest.alternativas.length === 1}
                                        className="text-slate-500 hover:text-red-400 disabled:opacity-50"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs px-5 py-2.5 rounded-xl transition duration-150 shadow-md shadow-brand-blue/10"
                      >
                        {isPending ? "A publicar..." : "Publicar Avaliação"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Exam List */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl h-fit">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Lista de Provas</h3>
                  {data.evaluations?.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">Sem exames registados.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.evaluations?.map((evalu: any) => (
                        <div key={evalu.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <h4 className="font-bold text-xs text-slate-700">{evalu.titulo}</h4>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">{evalu.disciplina?.nomeDisciplina}</span>
                          <div className="flex gap-4 text-[10px] text-slate-455 pt-2 border-t border-slate-200/50">
                            <span>{evalu.duracaoMinutos} min</span>
                            <span>Nota Máxima: {evalu.notaMaxima}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Study/Work Groups Management */}
          {activeTab === "groups" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Group Creator Form */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl h-fit">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="h-4.5 w-4.5 text-brand-blue" /> Criar Grupo de Trabalho
                  </h3>
                  <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nome do Grupo</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Grupo de Programação A"
                        value={grpName}
                        onChange={(e) => setGrpName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Grupo</label>
                      <select 
                        value={grpType}
                        onChange={(e) => setGrpType(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      >
                        <option value="trabalho">Projeto / Trabalho Prático</option>
                        <option value="mentoria">Grupo de Mentoria Académica</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Disciplina Associada</label>
                      <select 
                        value={grpDisciplineId || ""}
                        onChange={(e) => setGrpDisciplineId(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      >
                        <option value="" disabled>Selecione a disciplina...</option>
                        {data.disciplines?.map((d: any) => (
                          <option key={d.id} value={d.id}>{d.nomeDisciplina}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs py-2.5 rounded-xl transition duration-150 shadow-md shadow-brand-blue/10"
                    >
                      {isPending ? "A criar..." : "Criar Grupo"}
                    </button>
                  </form>
                </div>

                {/* 2. Group List & Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Groups Cards Row */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Seus Grupos de Trabalho</h3>
                    {data.groups?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 italic text-center">Nenhum grupo ativo criado.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.groups?.map((group: any) => {
                          const isSelected = selectedGroupId === group.id;
                          const hasMentor = group.membros?.some((m: any) => m.funcaoNoGrupo === "mentor");

                          return (
                            <div 
                              key={group.id}
                              className={`p-4 border rounded-xl transition duration-150 flex flex-col justify-between ${
                                isSelected
                                  ? "border-brand-blue/80 bg-slate-50/60 shadow-lg shadow-brand-blue/5"
                                  : "border-slate-200 bg-slate-50/20 hover:bg-slate-50/40"
                              }`}
                            >
                              <div className="cursor-pointer" onClick={() => setSelectedGroupId(group.id)}>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                    group.tipoGrupo === "mentoria" ? "bg-brand-green/10 text-brand-green" : "bg-brand-blue/10 text-brand-blue"
                                  }`}>
                                    {group.tipoGrupo === "mentoria" ? "Mentoria" : "Trabalho"}
                                  </span>
                                  {hasMentor && (
                                    <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">Tem Mentor</span>
                                  )}
                                </div>
                                <h4 className="font-bold text-xs text-slate-700 mt-3">{group.nomeGrupo}</h4>
                                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mt-0.5">
                                  {group.disciplina?.nomeDisciplina} | Semestre {group.disciplina?.semestre}º
                                </span>
                              </div>

                              <div className="flex justify-between items-center text-xs text-slate-500 mt-6 pt-3 border-t border-slate-200/60">
                                <span>{group.membros?.length || 0} Membros</span>
                                <button
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="text-slate-500 hover:text-red-400 p-1 rounded-md transition"
                                  title="Eliminar Grupo"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected Group Detail Section */}
                  {selectedGroupId && data.groups?.find((g: any) => g.id === selectedGroupId) && (
                    (() => {
                      const group = data.groups.find((g: any) => g.id === selectedGroupId);
                      return (
                        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6">
                          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-800">{group.nomeGrupo}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{group.tipoGrupo} | {group.disciplina?.nomeDisciplina}</p>
                            </div>
                          </div>

                          {/* Member Table */}
                          <div className="space-y-3">
                            <h5 className="font-bold text-[10px] text-slate-450 uppercase tracking-widest">Estudantes no Grupo</h5>
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                              <table className="min-w-[640px] text-left text-xs">
                                <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                                  <tr>
                                    <th className="p-3">Nome</th>
                                    <th className="p-3">Matrícula</th>
                                    <th className="p-3">Função</th>
                                    <th className="p-3 text-center">Ações</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850">
                                  {group.membros?.map((m: any) => (
                                    <tr key={m.idUsuario} className="hover:bg-slate-50/20">
                                      <td className="p-3 font-bold text-slate-700">{m.usuario?.nome}</td>
                                      <td className="p-3 text-slate-500 font-mono">{m.usuario?.numEstudanteLogin}</td>
                                      <td className="p-3">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                          m.funcaoNoGrupo === "admin"
                                            ? "bg-red-500/10 text-red-400 border border-red-500/10"
                                            : m.funcaoNoGrupo === "mentor"
                                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                                              : "bg-slate-850 text-slate-400"
                                        }`}>
                                          {m.funcaoNoGrupo}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        {m.idUsuario !== professorId ? (
                                          <button
                                            onClick={() => handleRemoveGroupMember(group.id, m.idUsuario)}
                                            className="text-slate-500 hover:text-red-400 p-1 transition"
                                            title="Remover do Grupo"
                                          >
                                            <X className="h-4.5 w-4.5" />
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-slate-650 italic">Criador</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Add Member form */}
                          <div className="pt-4 border-t border-slate-200/60">
                            <h5 className="font-bold text-[10px] text-slate-450 uppercase tracking-widest mb-3">Inscrever Novo Membro</h5>
                            {nonMembers.length === 0 ? (
                              <p className="text-xs text-slate-500 italic">Todos os alunos inscritos na disciplina já são membros deste grupo.</p>
                            ) : (
                              <form onSubmit={handleAddGroupMember} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Selecionar Aluno</label>
                                  <select
                                    value={newMemberId || ""}
                                    onChange={(e) => setNewMemberId(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-350 focus:outline-none"
                                  >
                                    <option value="" disabled>Selecione...</option>
                                    {nonMembers.map((s: any) => (
                                      <option key={s.id} value={s.id}>{s.nome} ({s.numEstudanteLogin})</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Papel no Grupo</label>
                                  <select
                                    value={newMemberRole}
                                    onChange={(e) => setNewMemberRole(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none"
                                  >
                                    <option value="membro">Membro Comum</option>
                                    {group.tipoGrupo === "mentoria" && <option value="mentor">Aluno Mentor</option>}
                                    {group.tipoGrupo === "trabalho" && <option value="mentor">Líder / Mentor</option>}
                                    <option value="admin">Co-Administrador</option>
                                  </select>
                                </div>
                                <button
                                  type="submit"
                                  disabled={isPending || !newMemberId}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition duration-150 w-full shadow-sm"
                                >
                                  {isPending ? "A inscrever..." : "Inscrever Estudante"}
                                </button>
                              </form>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Live Proctoring Monitor */}
          {activeTab === "proctoring" && (
            <div className="space-y-8 animate-fadeIn">

              {/* Selected Exam for live logs */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Acompanhamento Proctoring em Direto</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Selecione o exame ativo para auditar focos, IP e webcams dos candidatos</p>
                </div>
                <select
                  value={selectedExamId || ""}
                  onChange={(e) => setSelectedExamId(Number(e.target.value))}
                  className="px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600 focus:outline-none"
                >
                  <option value="" disabled>Escolher exame ativo...</option>
                  {data.evaluations?.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.titulo}</option>
                  ))}
                </select>
              </div>

              {selectedExamId && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Candidates Cards Grid */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                      <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Monitor de Candidatos Online</h4>
                    </div>

                    {data.evaluations?.find((e: any) => e.id === selectedExamId)?.tentativas?.length === 0 ? (
                      <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center">
                        <p className="text-xs text-slate-500">Nenhum estudante a realizar o exame de momento.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.evaluations
                          ?.find((e: any) => e.id === selectedExamId)
                          ?.tentativas?.map((tent: any) => {
                            const isHigh = tent.monitoramento?.nivelSuspeita === "alto";
                            const isMed = tent.monitoramento?.nivelSuspeita === "medio";
                            const isBlocked = tent.statusTentativa === "bloqueada";

                            return (
                              <div 
                                key={tent.id}
                                className={`bg-white/50 p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                                  isBlocked
                                    ? "border-slate-200 bg-white/10 opacity-60"
                                    : isHigh
                                      ? "border-red-500/80 shadow-lg shadow-red-500/5 ring-1 ring-red-500/20"
                                      : isMed
                                        ? "border-amber-500/60"
                                        : "border-slate-200"
                                }`}
                              >
                                {isHigh && !isBlocked && (
                                  <div className="absolute right-0 top-0 h-1.5 w-full bg-gradient-to-r from-red-600 to-red-400 animate-pulse"></div>
                                )}

                                <div className="space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="font-bold text-sm text-slate-700">{tent.estudante?.nome}</h5>
                                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{tent.estudante?.numEstudanteLogin}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                      isBlocked
                                        ? "bg-slate-850 text-slate-400"
                                        : isHigh
                                          ? "bg-red-500/10 text-red-400 animate-pulse"
                                          : isMed
                                            ? "bg-amber-500/10 text-amber-400"
                                            : "bg-emerald-500/10 text-emerald-450"
                                    }`}>
                                      {isBlocked ? "Bloqueado" : `Suspeita: ${tent.monitoramento?.nivelSuspeita || "baixa"}`}
                                    </span>
                                  </div>

                                  {/* Proctoring statistics */}
                                  <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-900/60">
                                    <div>
                                      <span className="text-slate-500">Câmara Web:</span>{" "}
                                      <span className={`font-bold ${tent.monitoramento?.webcamAtiva ? "text-emerald-500" : "text-red-405"}`}>
                                        {tent.monitoramento?.webcamAtiva ? "Ligada" : "Desligada"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Aba Perdida:</span>{" "}
                                      <span className={`font-bold ${tent.monitoramento?.perdaFoco > 2 ? "text-red-400" : "text-slate-350"}`}>
                                        {tent.monitoramento?.perdaFoco || 0}x
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Copiar Texto:</span>{" "}
                                      <span className={`font-bold ${tent.monitoramento?.tentativasCopia > 0 ? "text-red-400" : "text-slate-350"}`}>
                                        {tent.monitoramento?.tentativasCopia || 0}x
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500">Multi-Rosto:</span>{" "}
                                      <span className={`font-bold ${tent.monitoramento?.deteccaoMultiplosRostos ? "text-red-400" : "text-slate-350"}`}>
                                        {tent.monitoramento?.deteccaoMultiplosRostos ? "Sim" : "Não"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2.5 mt-6 border-t border-slate-900/40 pt-4">
                                  {isBlocked ? (
                                    <button
                                      onClick={() => handleUpdateAttemptStatus(tent.id, "em_curso")}
                                      className="flex-1 inline-flex justify-center items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-2 rounded-xl text-xs font-bold transition"
                                    >
                                      <Unlock className="h-3.5 w-3.5" /> Desbloquear
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleUpdateAttemptStatus(tent.id, "bloqueada")}
                                        className="flex-1 inline-flex justify-center items-center gap-1.5 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-slate-800 py-2 rounded-xl text-xs font-bold transition"
                                      >
                                        <Lock className="h-3.5 w-3.5" /> Bloquear
                                      </button>
<button
                                        onClick={() => handleAdvertirEstudante(tent.id, tent.estudante?.nome)}
                                        className="flex-1 inline-flex justify-center items-center gap-1.5 border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 py-2 rounded-xl text-xs font-bold transition"
                                      >
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Advertir
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {/* Security events feed */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Relatório de Eventos Live</h3>
                    {data.evaluations
                      ?.find((e: any) => e.id === selectedExamId)
                      ?.tentativas?.flatMap((t: any) => t.logsSeguranca?.map((l: any) => ({ ...l, estudanteNome: t.estudante?.nome })) || [])
                      .length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">Nenhum registo de incidente detetado.</p>
                    ) : (
                      <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-2">
                        {data.evaluations
                          ?.find((e: any) => e.id === selectedExamId)
                          ?.tentativas?.flatMap((t: any) => t.logsSeguranca?.map((l: any) => ({ ...l, estudanteNome: t.estudante?.nome })) || [])
                          .sort((a: any, b: any) => new Date(b.dataRegisto).getTime() - new Date(a.dataRegisto).getTime())
                          .map((log: any, idx: number) => {
                            const isCopy = log.tipoEvento === "tentativa_copiar";
                            return (
                              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-bold text-xs text-slate-700 truncate">{log.estudanteNome}</span>
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    isCopy ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                                  }`}>{isCopy ? "Cópia" : "Foco"}</span>
                                </div>
                                <p className="text-[11px] text-slate-450 leading-snug">{log.descricao}</p>
                                <span className="text-[9px] text-slate-550 block mt-2 font-semibold">
                                  {new Date(log.dataRegisto).toLocaleTimeString("pt-PT")}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Carreiras & Vagas */}
          {activeTab === "opportunities" && (
            <div className="space-y-8 animate-fadeIn">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Opportunities Creator */}
                <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl h-fit">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Plus className="h-4.5 w-4.5 text-brand-blue" /> Publicar Vaga de Carreira
                  </h3>
                  <form onSubmit={handleCreateOpportunity} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Título da Oportunidade</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Desenvolvedor Júnior Next.js"
                        value={oppTitle}
                        onChange={(e) => setOppTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Descrição</label>
                      <textarea 
                        rows={3}
                        placeholder="Ex: Integração na equipa de desenvolvimento..."
                        value={oppDesc}
                        onChange={(e) => setOppDesc(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Empresa / Lab</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Centro de Informática Kimpa"
                        value={oppCompany}
                        onChange={(e) => setOppCompany(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tipo de Oportunidade</label>
                      <select 
                        value={oppType}
                        onChange={(e) => setOppType(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      >
                        <option value="estagio">Estágio Profissional</option>
                        <option value="emprego">Vaga de Emprego</option>
                        <option value="pesquisa">Bolsa de Pesquisa Científica</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Requisitos principais</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Domínio de C/C++ ou JS, 3º ano concluído."
                        value={oppReqs}
                        onChange={(e) => setOppReqs(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Prazo Limite</label>
                      <input 
                        type="date"
                        value={oppDate}
                        onChange={(e) => setOppDate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs text-slate-600 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-xs py-2.5 rounded-xl transition duration-150 shadow-md shadow-brand-blue/10"
                    >
                      {isPending ? "A publicar..." : "Publicar Oportunidade"}
                    </button>
                  </form>
                </div>

                {/* Opportunities List and Candidates Admissions */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Vagas Publicadas por Si</h3>
                    {data.opportunities?.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 italic">Nenhuma vaga registada na base de dados.</p>
                    ) : (
                      <div className="space-y-4">
                        {data.opportunities?.map((opp: any) => (
                          <div 
                            key={opp.idOportunidade}
                            className={`p-5 rounded-2xl border transition duration-200 ${
                              selectedOpportunityId === opp.idOportunidade
                                ? "border-brand-blue/80 bg-slate-50/60 shadow-lg shadow-brand-blue/5"
                                : "border-slate-200 bg-slate-50/20 hover:bg-slate-50/40"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="cursor-pointer flex-1" onClick={() => setSelectedOpportunityId(opp.idOportunidade)}>
                                <span className="text-[9px] bg-slate-850 text-slate-330 font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">{opp.tipo}</span>
                                <h4 className="font-bold text-sm text-slate-700 mt-2.5">{opp.titulo}</h4>
                                <span className="text-[10px] text-slate-500 font-bold tracking-wider mt-0.5 block">{opp.empresa}</span>
                                <p className="text-slate-450 text-xs mt-2.5 line-clamp-2 leading-relaxed">{opp.descricao}</p>
                              </div>
                              <span className="text-xs text-brand-blue font-bold shrink-0">{opp.candidaturas?.length || 0} Candidatos</span>
                            </div>

                            {/* Candidate List (Show only if this opportunity is selected) */}
                            {selectedOpportunityId === opp.idOportunidade && opp.candidaturas?.length > 0 && (
                              <div className="mt-5 pt-4 border-t border-slate-200/60 space-y-4">
                                <h5 className="font-bold text-[10px] text-slate-455 uppercase tracking-widest">Alunos Candidatados</h5>
                                <div className="space-y-3">
                                  {opp.candidaturas.map((cand: any) => (
                                    <div key={cand.idCandidatura} className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between gap-4">
                                      <div>
                                        <h6 className="font-bold text-xs text-slate-700">{cand.usuario?.nome}</h6>
                                        <span className="text-[10px] text-slate-550 block">{cand.usuario?.email}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                          cand.estado === "aprovado"
                                            ? "bg-emerald-500/10 text-emerald-450"
                                            : cand.estado === "rejeitado"
                                              ? "bg-red-500/10 text-red-400"
                                              : cand.estado === "entrevistado"
                                                ? "bg-amber-500/10 text-amber-400"
                                                : "bg-slate-850 text-slate-405"
                                        }`}>
                                          {cand.estado}
                                        </span>
                                        <div className="flex gap-1.5">
                                          <button
                                            onClick={() => handleUpdateCandidacyStatus(cand.idCandidatura, "entrevistado")}
                                            className="p-1 bg-slate-50 border border-slate-200 text-slate-350 hover:text-slate-800 rounded-lg text-xs font-bold"
                                            title="Convocar para entrevista"
                                          >
                                            Entrevista
                                          </button>
                                          <button
                                            onClick={() => handleUpdateCandidacyStatus(cand.idCandidatura, "aprovado")}
                                            className="p-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-555 hover:text-slate-800 rounded-lg text-xs font-bold"
                                            title="Admitir Candidato"
                                          >
                                            Admitir
                                          </button>
                                          <button
                                            onClick={() => handleUpdateCandidacyStatus(cand.idCandidatura, "rejeitado")}
                                            className="p-1 bg-red-600/10 border border-red-500/20 text-red-405 hover:bg-red-555 hover:text-slate-800 rounded-lg text-xs font-bold"
                                            title="Dispensar"
                                          >
                                            Dispensar
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Vitrine de Projetos */}
          {activeTab === "projects" && (
            <div className="bg-white border border-slate-200 p-6 rounded-2xl animate-fadeIn space-y-8">
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Aprovação de Projetos Universitários</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Analise o repositório e publique trabalhos na vitrine pública do Kimpa Connect</p>
              </div>

              {data.projects?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">Sem projetos práticos registados.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Pending Approval */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Pendentes de Análise
                    </h4>
                    {data.projects?.filter((p: any) => !p.idProfessorAutorizador).length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">Nenhum projeto pendente.</p>
                    ) : (
                      <div className="space-y-4">
{data.projects?.filter((p: any) => !p.idProfessorAutorizador).map((proj: any) => (
                          <div key={proj.id} className="overflow-hidden p-0 bg-slate-50/60 border border-slate-200 rounded-xl space-y-0">
                            {proj.urlImagem && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={proj.urlImagem} alt={proj.tituloProjeto} className="h-28 w-full object-cover" />
                            )}
                            <div className="p-5 space-y-3">
                            <h5 className="font-bold text-xs text-slate-700">{proj.tituloProjeto}</h5>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{proj.disciplina?.nomeDisciplina}</span>
                            <p className="text-slate-450 text-[11px] leading-relaxed line-clamp-3">{proj.descricao}</p>
                            <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-500 pt-2 border-t border-slate-200/50">
                              <span>Autores:</span>
                              {proj.autores?.map((a: any) => (
                                <span key={a.usuario?.id} className="bg-white px-2 py-0.5 rounded-full text-slate-400">{a.usuario?.nome}</span>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                              {proj.urlRepositorio && (
                                <a 
                                  href={proj.urlRepositorio}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-white text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:text-slate-700 transition"
                                >
                                  GitHub <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {proj.urlAnexo && (
                                <a 
                                  href={proj.urlAnexo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-white text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:text-slate-700 transition"
                                >
                                  <FileText className="h-3 w-3" /> Documento
                                </a>
                              )}
                              <button
                                onClick={() => handleAuthorizeProject(proj.id)}
                                disabled={isPending}
                                className="bg-brand-blue hover:bg-brand-blue-dark text-slate-800 font-bold px-3 py-1.5 rounded-lg text-[10px] transition"
                              >
                                Autorizar Publicação
                              </button>
                            </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Publicized */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Publicados Oficialmente
                    </h4>
                    {data.projects?.filter((p: any) => p.idProfessorAutorizador).length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">Nenhum projeto publicado ainda.</p>
                    ) : (
                      <div className="space-y-4">
{data.projects?.filter((p: any) => p.idProfessorAutorizador).map((proj: any) => (
                          <div key={proj.id} className="overflow-hidden p-0 bg-slate-50 border border-slate-200 rounded-xl space-y-0 relative">
                            <div className="absolute top-0 right-0 z-10 bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-bl-xl text-[9px] font-extrabold uppercase flex items-center gap-1">
                              <Check className="h-3 w-3" /> Publicado
                            </div>
                            {proj.urlImagem && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={proj.urlImagem} alt={proj.tituloProjeto} className="h-28 w-full object-cover" />
                            )}
                            <div className="p-5 space-y-3">
                            <h5 className="font-bold text-xs text-slate-700 pr-16">{proj.tituloProjeto}</h5>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{proj.disciplina?.nomeDisciplina}</span>
                            <p className="text-slate-450 text-[11px] leading-relaxed line-clamp-3">{proj.descricao}</p>
                            <div className="flex flex-wrap gap-1.5 text-[9px] text-slate-500 pt-2 border-t border-slate-200/50">
                              <span>Autores:</span>
                              {proj.autores?.map((a: any) => (
                                <span key={a.usuario?.id} className="bg-white px-2 py-0.5 rounded-full text-slate-400">{a.usuario?.nome}</span>
                              ))}
                            </div>
                            {proj.urlDemonstracao && (
                              <a 
                                href={proj.urlDemonstracao}
                                target="_blank"
                                  rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-blue hover:underline pt-1.5"
                              >
                                Ver Demonstração Online <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                            {proj.urlAnexo && (
                              <a 
                                href={proj.urlAnexo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-blue hover:underline"
                              >
                                <FileText className="h-3 w-3" /> Ver documento do projeto
                              </a>
                            )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
    </div>
  );
}

