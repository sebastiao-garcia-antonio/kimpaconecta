import { prisma } from "@/lib/prisma";

export function serializeBigInts<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (typeof value === "bigint") {
        return Number(value);
      }
      return value;
    })
  );
}

export class AcademicRepository {
static resumirMonitoramento(monitoramentos: any[]) {
    if (!Array.isArray(monitoramentos) || monitoramentos.length === 0) return null;

    const maisRecente = [...monitoramentos].sort((a, b) => Number(b.idMonitoramento) - Number(a.idMonitoramento))[0];

    return {
      perdaFoco: maisRecente.perdaFoco || 0,
      tentativasCopia: maisRecente.tentativasCopia || 0,
      mudancasIp: maisRecente.mudancasIp || 0,
      tempoInatividade: maisRecente.tempoInatividade || 0,
      webcamAtiva: Boolean(maisRecente.webcamAtiva),
      deteccaoMultiplosRostos: Boolean(maisRecente.deteccaoMultiplosRostos),
      nivelSuspeita: maisRecente.nivelSuspeita || "baixo",
    };
  }

  static async obterDisciplinasDoDocente(idDocente: number) {
    const vinculos = await this.getTeacherCoursesAndDisciplines(idDocente);
    const cursos = Array.isArray(vinculos) ? vinculos.map((vinculo: any) => vinculo.curso).filter(Boolean) : [];
    const disciplinas = cursos.flatMap((curso: any) =>
      (curso.disciplinas || []).map((disciplina: any) => ({
        idDisciplina: disciplina.id,
        nomeDisciplina: disciplina.nomeDisciplina,
        semestre: disciplina.semestre,
        nomeCurso: curso.nomeCurso,
        totalTurmas: curso.turmas?.length || 0,
        totalEstudantes: curso.turmas?.reduce((total: number, turma: any) => total + (turma.matriculas?.length || 0), 0) || 0
      }))
    );

    return serializeBigInts(disciplinas);
  }

  static async obterCursosEDisciplinasDoDocente(idDocente: number) {
    return this.getTeacherCoursesAndDisciplines(idDocente);
  }

  static async obterAvaliacoesDoDocente(idDocente: number) {
    return this.getTeacherEvaluations(idDocente);
  }

  static async obterOportunidadesParaEstudante(idEstudante: number) {
    const oportunidades = await prisma.oportunidadeAcademica.findMany({
      include: {
        criador: {
          select: {
            id: true,
            nome: true,
          }
        },
        candidaturas: {
          where: { idUsuario: idEstudante },
          select: {
            idCandidatura: true,
            estado: true,
            dataCandidatura: true
          }
        }
      },
      orderBy: { dataPublicacao: "desc" }
    });

    return serializeBigInts(oportunidades);
  }

  static async obterCandidaturasDoEstudante(idEstudante: number) {
    const candidaturas = await prisma.candidaturaOportunidade.findMany({
      where: { idUsuario: idEstudante },
      include: {
        oportunidade: {
          include: {
            criador: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      },
      orderBy: { dataCandidatura: "desc" }
    });

    return serializeBigInts(candidaturas);
  }

  static async criarCandidaturaOportunidade(idOportunidade: number, idUsuario: number) {
    const candidaturasExistentes = await prisma.candidaturaOportunidade.findFirst({
      where: {
        idOportunidade: BigInt(idOportunidade),
        idUsuario
      }
    });

    if (candidaturasExistentes) {
      return serializeBigInts(candidaturasExistentes);
    }

    const candidatura = await prisma.candidaturaOportunidade.create({
      data: {
        idOportunidade: BigInt(idOportunidade),
        idUsuario,
        estado: "pendente"
      }
    });

    return serializeBigInts(candidatura);
  }

  static async obterResumoAcademico() {
    const [
      totalCursos,
      totalDisciplinas,
      totalTurmas,
      totalEstudantes,
      totalAvaliacoes,
      totalOportunidades,
      totalCandidaturas,
      totalPresencas
    ] = await Promise.all([
      prisma.curso.count(),
      prisma.disciplina.count(),
      prisma.turma.count(),
      prisma.usuario.count({ where: { perfis: { some: { perfil: { nomePerfil: "estudante" } } } } }),
      prisma.avaliacao.count(),
      prisma.oportunidadeAcademica.count(),
      prisma.candidaturaOportunidade.count(),
      prisma.presencaAula.count()
    ]);

    return serializeBigInts({
      totalCursos,
      totalDisciplinas,
      totalTurmas,
      totalEstudantes,
      totalAvaliacoes,
      totalOportunidades,
      totalCandidaturas,
      totalPresencas
    });
  }

  static async obterDisciplinasDoEstudante(idEstudante: number) {
    const matriculas = await prisma.matricula.findMany({
      where: { idUsuario: idEstudante },
      include: {
        turma: {
          include: {
            curso: {
              include: {
                disciplinas: {
                  include: {
                    presencas: {
                      where: { idUsuario: idEstudante },
                      orderBy: { dataAula: "desc" },
                      take: 6
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { anoLectivo: "desc" }
    });

    const disciplinas = matriculas.flatMap((matricula) => {
      const curso = matricula.turma?.curso;
      if (!curso) return [];

      return curso.disciplinas.map((disciplina) => {
        const presencas = disciplina.presencas || [];
        const totalPresencas = presencas.length;
        const presencasPresentes = presencas.filter((presenca) => presenca.presente).length;

        return {
          idDisciplina: disciplina.id,
          nomeDisciplina: disciplina.nomeDisciplina,
          semestre: disciplina.semestre,
          nomeCurso: curso.nomeCurso,
          nomeTurma: matricula.turma.nomeTurma,
          anoCurricular: matricula.turma.anoCurricular,
          periodo: matricula.turma.periodo,
          totalPresencas,
          presencasPresentes,
          taxaPresenca: totalPresencas > 0 ? Math.round((presencasPresentes / totalPresencas) * 100) : 0
        };
      });
    });

    return serializeBigInts(disciplinas);
  }

  static async obterHistoricoAcademicoDoEstudante(idEstudante: number) {
    const historico = await prisma.historicoAcademico.findMany({
      where: { idEstudante },
      include: {
        disciplina: {
          include: {
            curso: true
          }
        }
      },
      orderBy: [
        { anoLectivo: "desc" },
        { dataRegisto: "desc" }
      ]
    });

    return serializeBigInts(historico);
  }

  static async obterPresencasDoEstudante(idEstudante: number) {
    const matriculas = await prisma.matricula.findMany({
      where: { idUsuario: idEstudante },
      include: {
        turma: {
          include: {
            curso: {
              include: {
                disciplinas: {
                  include: {
                    presencas: {
                      where: { idUsuario: idEstudante },
                      orderBy: { dataAula: "desc" }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { anoLectivo: "desc" }
    });

    const mapaPresencas = new Map<number, any>();

    for (const matricula of matriculas) {
      const curso = matricula.turma?.curso;
      if (!curso) continue;

      for (const disciplina of curso.disciplinas || []) {
        for (const presenca of disciplina.presencas || []) {
          const idPresenca = Number(presenca.idPresenca);
          if (!mapaPresencas.has(idPresenca)) {
            mapaPresencas.set(idPresenca, {
              ...presenca,
              nomeDisciplina: disciplina.nomeDisciplina,
              nomeCurso: curso.nomeCurso,
              nomeTurma: matricula.turma?.nomeTurma,
              anoCurricular: matricula.turma?.anoCurricular,
              anoLectivo: matricula.anoLectivo
            });
          }
        }
      }
    }

    return serializeBigInts(Array.from(mapaPresencas.values()));
  }

  static async obterContextoAcademicoDoEstudante(idEstudante: number) {
    const matriculas = await prisma.matricula.findMany({
      where: { idUsuario: idEstudante },
      include: {
        turma: {
          select: {
            anoCurricular: true,
            nomeTurma: true,
            periodo: true
          }
        }
      },
      orderBy: [
        { anoLectivo: "desc" },
        { id: "desc" }
      ]
    });

    const anosDisponiveis = Array.from(new Set(matriculas.map((matricula) => matricula.turma.anoCurricular))).sort(
      (a, b) => a - b
    );

    return serializeBigInts({
      anoActual: matriculas[0]?.turma?.anoCurricular || null,
      anosDisponiveis
    });
  }

  // Get courses and their disciplines/students for a teacher
  static async getTeacherCoursesAndDisciplines(idProfessor: number): Promise<any> {
    const userCourses = await prisma.usuarioCurso.findMany({
      where: { idUsuario: idProfessor },
      include: {
        curso: {
          include: {
            disciplinas: true,
            turmas: {
              include: {
                matriculas: {
                  include: {
                    usuario: {
                      select: {
                        id: true,
                        nome: true,
                        email: true,
                        numEstudanteLogin: true,
                        fotoPerfil: true,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Fallback: If teacher has no course mapping, map them to Curso 1 to see data
    if (userCourses.length === 0) {
      const exists = await prisma.usuarioCurso.findFirst({
        where: { idUsuario: idProfessor, idCurso: 1 }
      });
      if (!exists) {
        try {
          await prisma.usuarioCurso.create({
            data: { idUsuario: idProfessor, idCurso: 1, dataVinculo: new Date() }
          });
          return this.getTeacherCoursesAndDisciplines(idProfessor);
        } catch (e) {
          // Ignore
        }
      }
    }

    return serializeBigInts(userCourses);
  }

// Get all evaluations created by the teacher
  static async getTeacherEvaluations(idProfessor: number) {
    const evaluations = await prisma.avaliacao.findMany({
      where: { idProfessor },
      include: {
        disciplina: true,
        tentativas: {
          include: {
            estudante: {
              select: {
                id: true,
                nome: true,
                email: true,
                numEstudanteLogin: true,
              }
            },
            monitoramento: true,
            logsSeguranca: {
              orderBy: { dataRegisto: "desc" }
            }
          }
        }
      },
      orderBy: { dataInicio: "desc" }
    });

    const evaluacoesComMonitoramento = evaluations.map((avaliacao: any) => ({
      ...avaliacao,
      tentativas: (avaliacao.tentativas || []).map((tentativa: any) => ({
        ...tentativa,
        monitoramento: this.resumirMonitoramento(tentativa.monitoramento),
      })),
    }));

    return serializeBigInts(evaluacoesComMonitoramento);
  }

  // Get teacher virtual meetings
  static async getTeacherMeetings(idProfessor: number) {
    const meetings = await prisma.reuniaoVirtual.findMany({
      where: { idCriador: idProfessor },
      include: {
        grupo: true
      },
      orderBy: { dataInicio: "desc" }
    });
    return serializeBigInts(meetings);
  }

  // Get teacher reputation
  static async getTeacherReputacao(idProfessor: number) {
    const rep = await prisma.reputacaoAcademica.findFirst({
      where: { idUsuario: idProfessor }
    });
if (!rep) {
      try {
        const newRep = await prisma.reputacaoAcademica.create({
          data: {
            idUsuario: idProfessor,
            pontos: 0,
            nivel: "iniciante",
            mentoriasRealizadas: 0,
            projetosPublicados: 0,
            feedbackPositivo: 0
          }
        });
        return serializeBigInts(newRep);
      } catch (e) {
        return {
          idUsuario: idProfessor,
          pontos: 0,
          nivel: "iniciante",
          mentoriasRealizadas: 0,
          projetosPublicados: 0,
          feedbackPositivo: 0
        };
      }
    }
    return serializeBigInts(rep);
  }

  // Create standard evaluation
  static async createEvaluation(data: {
    idDisciplina: number;
    idProfessor: number;
    titulo: string;
    dataInicio: Date;
    dataFim: Date;
    duracaoMinutos: number;
    notaMaxima: number;
    questoes: {
      enunciado: string;
      tipoQuestao: string;
      alternativas?: {
        textoAlternativa: string;
        isCorreta: boolean;
      }[];
    }[];
  }) {
    const avaliacao = await prisma.avaliacao.create({
      data: {
        idDisciplina: data.idDisciplina,
        idProfessor: data.idProfessor,
        titulo: data.titulo,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        duracaoMinutos: data.duracaoMinutos,
        notaMaxima: data.notaMaxima,
        questoes: {
          create: data.questoes.map(q => ({
            enunciado: q.enunciado,
            tipoQuestao: q.tipoQuestao,
            alternativas: q.alternativas ? {
              create: q.alternativas.map(alt => ({
                textoAlternativa: alt.textoAlternativa,
                isCorreta: alt.isCorreta
              }))
            } : undefined
          }))
        }
      },
      include: {
        questoes: {
          include: {
            alternativas: true
          }
        }
      }
    });
    return serializeBigInts(avaliacao);
  }

  // Record student attendance
  static async registerAttendance(records: {
    idUsuario: number;
    idDisciplina: number;
    dataAula: Date;
    presente: boolean;
    observacao?: string;
  }[]) {
    const studentIds = records.map(r => r.idUsuario);
    const idDisciplina = records[0]?.idDisciplina;
    const dataAula = records[0]?.dataAula;

    if (idDisciplina && dataAula) {
      await prisma.presencaAula.deleteMany({
        where: {
          idDisciplina,
          dataAula,
          idUsuario: { in: studentIds }
        }
      });
    }

    const created = await prisma.presencaAula.createMany({
      data: records.map(r => ({
        idUsuario: r.idUsuario,
        idDisciplina: r.idDisciplina,
        dataAula: r.dataAula,
        presente: r.presente,
        observacao: r.observacao ?? ""
      }))
    });

    return created;
  }

  // Get attendance history
  static async getAttendanceHistory(idDisciplina: number) {
    const history = await prisma.presencaAula.findMany({
      where: { idDisciplina },
      include: {
        usuario: {
          select: { id: true, nome: true }
        }
      },
      orderBy: { dataAula: "desc" }
    });
    return serializeBigInts(history);
  }

  // Upload didatic material
  static async uploadMaterial(data: {
    idDisciplina: number;
    idProfessor: number;
    titulo: string;
    descricao?: string;
    tipoMaterial: string;
    urlArquivo: string;
    tamanhoArquivo?: string;
  }) {
    const material = await prisma.materialDidatico.create({
      data: {
        idDisciplina: data.idDisciplina,
        idProfessor: data.idProfessor,
        titulo: data.titulo,
        descricao: data.descricao ?? "",
        tipoMaterial: data.tipoMaterial,
        urlArquivo: data.urlArquivo,
        tamanhoArquivo: data.tamanhoArquivo ?? ""
      }
    });
    return serializeBigInts(material);
  }

  // Get materials for discipline
  static async getMaterials(idDisciplina: number) {
    const materials = await prisma.materialDidatico.findMany({
      where: { idDisciplina },
      orderBy: { dataPublicacao: "desc" }
    });
    return serializeBigInts(materials);
  }

  // Schedule virtual meeting
  static async createMeeting(data: {
    titulo: string;
    descricao?: string;
    idCriador: number;
    idGrupo?: number;
    linkReuniao: string;
    plataforma: string;
    dataInicio: Date;
    dataFim?: Date;
    status?: string;
  }) {
    const meeting = await prisma.reuniaoVirtual.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao ?? "",
        idCriador: data.idCriador,
        idGrupo: data.idGrupo ?? null,
        linkReuniao: data.linkReuniao,
        plataforma: data.plataforma,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim ?? null,
        status: data.status ?? "agendada"
      }
    });
    return serializeBigInts(meeting);
  }

  // Update exam attempt status (Proctoring control)
  static async updateAttemptStatus(idTentativa: number, status: string) {
    const attempt = await prisma.tentativaAvaliacao.update({
      where: { id: idTentativa },
      data: { statusTentativa: status }
    });
    return serializeBigInts(attempt);
  }

  // Showcase Projects operations
  static async getShowcaseProjects(idProfessor: number) {
    const projects = await prisma.projetoVitrine.findMany({
      include: {
        autores: {
          include: {
            usuario: {
              select: { id: true, nome: true, email: true }
            }
          }
        },
        disciplina: true,
        professor: {
          select: { id: true, nome: true }
        }
      },
      orderBy: { dataPublicacao: "desc" }
    });
    return serializeBigInts(projects);
  }

  static async authorizeProject(idProjeto: number, idProfessor: number) {
    const project = await prisma.projetoVitrine.update({
      where: { id: idProjeto },
      data: { idProfessorAutorizador: idProfessor }
    });
    return serializeBigInts(project);
  }

  // ==========================================
  // NEW METHODS FOR OPPORTUNITIES & CAREERS
  // ==========================================

  // Fetch opportunities created by the teacher
  static async getTeacherOpportunities(idProfessor: number) {
    const opportunities = await prisma.oportunidadeAcademica.findMany({
      where: { criadoPor: idProfessor },
      include: {
        candidaturas: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                numEstudanteLogin: true,
                fotoPerfil: true
              }
            }
          },
          orderBy: { dataCandidatura: "desc" }
        }
      },
      orderBy: { dataPublicacao: "desc" }
    });
    return serializeBigInts(opportunities);
  }

  // Create an opportunity
  static async createOpportunity(data: {
    titulo: string;
    descricao: string;
    tipo: string;
    empresa?: string;
    requisitos?: string;
    dataLimite?: Date;
    criadoPor: number;
  }) {
    const opportunity = await prisma.oportunidadeAcademica.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        empresa: data.empresa ?? "",
        requisitos: data.requisitos ?? "",
        dataLimite: data.dataLimite ?? null,
        criadoPor: data.criadoPor
      }
    });
    return serializeBigInts(opportunity);
  }

  // Update candidacy status
  static async updateCandidaturaStatus(idCandidatura: number, estado: string) {
    const candidacy = await prisma.candidaturaOportunidade.update({
      where: { idCandidatura: BigInt(idCandidatura) },
      data: { estado }
    });
    return serializeBigInts(candidacy);
  }

  // Get unread notifications for a user
  static async getTeacherNotifications(idProfessor: number) {
    const notifications = await prisma.notificacao.findMany({
      where: { idUsuario: idProfessor, lida: false },
      orderBy: { dataEnvio: "desc" },
      take: 10
    });
    return serializeBigInts(notifications);
  }

  // Mark notification as read
  static async markNotificationAsRead(idNotificacao: number) {
    const notification = await prisma.notificacao.update({
      where: { idNotificacao: BigInt(idNotificacao) },
      data: { lida: true }
    });
    return serializeBigInts(notification);
  }

  // ==========================================
  // NEW METHODS FOR WORKGROUPS & STUDY GROUPS
  // ==========================================

  // Get all study or project groups managed or created by the teacher
  static async getTeacherGroups(idProfessor: number) {
    const groups = await prisma.grupo.findMany({
      where: {
        OR: [
          { idCriador: idProfessor },
          { membros: { some: { idUsuario: idProfessor } } }
        ]
      },
      include: {
        disciplina: true,
        turma: true,
        membros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                numEstudanteLogin: true
              }
            }
          }
        }
      },
      orderBy: { id: "desc" }
    });
    return serializeBigInts(groups);
  }

  // Create a new study/work group
  static async createGroup(data: {
    nomeGrupo: string;
    tipoGrupo: string; // 'turma', 'disciplina', 'trabalho', 'mentoria'
    idTurma?: number;
    idDisciplina?: number;
    idCriador: number;
  }) {
    const group = await prisma.grupo.create({
      data: {
        nomeGrupo: data.nomeGrupo,
        tipoGrupo: data.tipoGrupo,
        idTurma: data.idTurma ?? null,
        idDisciplina: data.idDisciplina ?? null,
        idCriador: data.idCriador,
        membros: {
          create: {
            idUsuario: data.idCriador,
            funcaoNoGrupo: "admin" // Creator teacher is admin
          }
        }
      }
    });
    return serializeBigInts(group);
  }

  // Enroll a student in a group
  static async addGroupMember(idGrupo: number, idUsuario: number, funcaoNoGrupo = "membro") {
    const member = await prisma.grupoMembro.create({
      data: {
        idGrupo,
        idUsuario,
        funcaoNoGrupo
      }
    });
    return serializeBigInts(member);
  }

  // Remove a member from a group
  static async removeGroupMember(idGrupo: number, idUsuario: number) {
    const member = await prisma.grupoMembro.delete({
      where: {
        idGrupo_idUsuario: {
          idGrupo,
          idUsuario
        }
      }
    });
    return serializeBigInts(member);
  }

  // Delete a study/work group
  static async deleteGroup(idGrupo: number) {
    const group = await prisma.grupo.delete({
      where: { id: idGrupo }
    });
    return serializeBigInts(group);
  }
}
