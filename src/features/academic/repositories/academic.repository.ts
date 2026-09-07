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
  static async getEntity(id: number) {
    return { id, status: "ok" };
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
    return serializeBigInts(evaluations);
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
            pontos: 120,
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
          pontos: 120,
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

  // Seeder V3: Seeding students, exams, proctoring, projects, opportunities, cands, notifications, AND GROUPS
  static async semearDadosSimulados(idProfessor: number) {
    // 1. Check if there are mock students in the DB. If not, create them.
    const mockStudentsData = [
      { nome: "Mário Silva Uíge", email: "mario.silva@kimpaconnect.ao", numEstudanteLogin: "20260010" },
      { nome: "Ana Sousa Cuanza", email: "ana.sousa@kimpaconnect.ao", numEstudanteLogin: "20260015" },
      { nome: "Carlos Neto Informática", email: "carlos.neto@kimpaconnect.ao", numEstudanteLogin: "20260020" },
      { nome: "Beatriz Lopes Uíge", email: "beatriz.lopes@kimpaconnect.ao", numEstudanteLogin: "20260025" }
    ];

    const studentIds: number[] = [];
    const estudantePerfil = await prisma.perfil.findFirst({
      where: { nomePerfil: "estudante" }
    });
    const idPerfil = estudantePerfil?.id ?? 4; // Fallback to 4

    for (const student of mockStudentsData) {
      let user = await prisma.usuario.findFirst({
        where: { email: student.email }
      });

      if (!user) {
        user = await prisma.usuario.create({
          data: {
            nome: student.nome,
            email: student.email,
            numEstudanteLogin: student.numEstudanteLogin,
            senha: "$2a$10$tMh4fG94k7p24uSj3rG3fO1t8D97D8vE9V2bJ9W2qG9Y2wG9zG9y6", // BCrypt dummy hash for '123456'
            status: "ativo",
            perfis: {
              create: {
                idPerfil
              }
            }
          }
        });
      }
      studentIds.push(user.id);
    }

    // Ensure they have matricula in class TL001 (id: 1)
    for (let i = 0; i < studentIds.length; i++) {
      const idUsuario = studentIds[i];
      const matriculaExists = await prisma.matricula.findFirst({
        where: { idUsuario, idTurma: 1 }
      });
      if (!matriculaExists) {
        await prisma.matricula.create({
          data: {
            idUsuario,
            idTurma: 1,
            numProcesso: `PROC-2026-00${i + 1}`,
            anoLectivo: 2026
          }
        });
      }
    }

    // 2. Ensure an evaluation exists for discipline 1
    let avaliacao = await prisma.avaliacao.findFirst({
      where: { idProfessor, idDisciplina: 1 }
    });

    if (!avaliacao) {
      const inicio = new Date();
      inicio.setHours(inicio.getHours() - 1); // Started 1h ago
      const fim = new Date();
      fim.setHours(fim.getHours() + 2); // Ends in 2h

      avaliacao = await prisma.avaliacao.create({
        data: {
          idDisciplina: 1,
          idProfessor,
          titulo: "Exame de Programação de Computadores",
          dataInicio: inicio,
          dataFim: fim,
          duracaoMinutos: 90,
          notaMaxima: 20.00,
          questoes: {
            create: [
              {
                enunciado: "O que é um algoritmo?",
                tipoQuestao: "multipla_escolha",
                alternativas: {
                  create: [
                    { textoAlternativa: "Uma sequência finita de instruções bem definidas", isCorreta: true },
                    { textoAlternativa: "Um tipo de hardware de computador", isCorreta: false },
                    { textoAlternativa: "Um programa que não termina", isCorreta: false }
                  ]
                }
              },
              {
                enunciado: "Qual das opções é um tipo de dados primitivo em C/C++?",
                tipoQuestao: "multipla_escolha",
                alternativas: {
                  create: [
                    { textoAlternativa: "int", isCorreta: true },
                    { textoAlternativa: "Vector", isCorreta: false },
                    { textoAlternativa: "String", isCorreta: false }
                  ]
                }
              }
            ]
          }
        }
      });
    }

    // 3. Create attempts for mock students with active proctoring events
    // Student 1: Mário Silva - Safe behavior (Low suspicion)
    const attempt1Exists = await prisma.tentativaAvaliacao.findFirst({
      where: { idAvaliacao: avaliacao.id, idEstudante: studentIds[0] }
    });
    if (!attempt1Exists) {
      const attempt1 = await prisma.tentativaAvaliacao.create({
        data: {
          idAvaliacao: avaliacao.id,
          idEstudante: studentIds[0],
          statusTentativa: "em_curso"
        }
      });

      await prisma.monitoramentoProva.create({
        data: {
          idTentativa: attempt1.id,
          perdaFoco: 0,
          tentativasCopia: 0,
          mudancasIp: 0,
          tempoInatividade: 10,
          webcamAtiva: true,
          deteccaoMultiplosRostos: false,
          nivelSuspeita: "baixo",
          bloqueado: false,
          observacao: "Estudante focado."
        }
      });
    }

    // Student 2: Ana Sousa - Suspicious (Medium suspicion: 2 focus losses, webcam off)
    const attempt2Exists = await prisma.tentativaAvaliacao.findFirst({
      where: { idAvaliacao: avaliacao.id, idEstudante: studentIds[1] }
    });
    if (!attempt2Exists) {
      const attempt2 = await prisma.tentativaAvaliacao.create({
        data: {
          idAvaliacao: avaliacao.id,
          idEstudante: studentIds[1],
          statusTentativa: "em_curso"
        }
      });

      await prisma.monitoramentoProva.create({
        data: {
          idTentativa: attempt2.id,
          perdaFoco: 2,
          tentativasCopia: 0,
          mudancasIp: 0,
          tempoInatividade: 45,
          webcamAtiva: false,
          deteccaoMultiplosRostos: false,
          nivelSuspeita: "medio",
          bloqueado: false,
          observacao: "Perdeu foco 2 vezes e desligou a webcam."
        }
      });

      await prisma.logsSeguranca.createMany({
        data: [
          { idTentativa: attempt2.id, tipoEvento: "perda_de_foco", descricao: "O estudante alterou a aba ativa do navegador." },
          { idTentativa: attempt2.id, tipoEvento: "perda_de_foco", descricao: "O estudante minimizou o browser de exame." }
        ]
      });
    }

    // Student 3: Carlos Neto - Cheating (High suspicion: 5 focus losses, 2 copy-paste, webcam active but showing multiple faces)
    const attempt3Exists = await prisma.tentativaAvaliacao.findFirst({
      where: { idAvaliacao: avaliacao.id, idEstudante: studentIds[2] }
    });
    if (!attempt3Exists) {
      const attempt3 = await prisma.tentativaAvaliacao.create({
        data: {
          idAvaliacao: avaliacao.id,
          idEstudante: studentIds[2],
          statusTentativa: "em_curso"
        }
      });

      await prisma.monitoramentoProva.create({
        data: {
          idTentativa: attempt3.id,
          perdaFoco: 5,
          tentativasCopia: 2,
          mudancasIp: 1,
          tempoInatividade: 5,
          webcamAtiva: true,
          deteccaoMultiplosRostos: true,
          nivelSuspeita: "alto",
          bloqueado: false,
          observacao: "Várias irregularidades: cópia de código e presença de outra pessoa na webcam."
        }
      });

      await prisma.logsSeguranca.createMany({
        data: [
          { idTentativa: attempt3.id, tipoEvento: "perda_de_foco", descricao: "Estudante mudou de aba para pesquisar no Google." },
          { idTentativa: attempt3.id, tipoEvento: "tentativa_copiar", descricao: "Tentativa de copiar código-fonte do enunciado." },
          { idTentativa: attempt3.id, tipoEvento: "perda_de_foco", descricao: "Mudança de aba registada." },
          { idTentativa: attempt3.id, tipoEvento: "tentativa_copiar", descricao: "Tentativa de copiar resposta." },
          { idTentativa: attempt3.id, tipoEvento: "perda_de_foco", descricao: "Janela do browser perdeu o foco principal." }
        ]
      });
    }

    // Student 4: Beatriz Lopes - Completed Attempt with good score
    const attempt4Exists = await prisma.tentativaAvaliacao.findFirst({
      where: { idAvaliacao: avaliacao.id, idEstudante: studentIds[3] }
    });
    if (!attempt4Exists) {
      const submetido = new Date();
      submetido.setMinutes(submetido.getMinutes() - 15);
      const attempt4 = await prisma.tentativaAvaliacao.create({
        data: {
          idAvaliacao: avaliacao.id,
          idEstudante: studentIds[3],
          inicioEm: new Date(Date.now() - 3600000), // 1h ago
          submetidoEm: submetido,
          notaObtida: 16.50,
          statusTentativa: "submetida"
        }
      });

      await prisma.monitoramentoProva.create({
        data: {
          idTentativa: attempt4.id,
          perdaFoco: 1,
          tentativasCopia: 0,
          mudancasIp: 0,
          tempoInatividade: 120,
          webcamAtiva: true,
          deteccaoMultiplosRostos: false,
          nivelSuspeita: "baixo",
          bloqueado: false,
          observacao: "Submetido com sucesso."
        }
      });
    }

    // 4. Create Showcase projects
    const p1 = await prisma.projetoVitrine.findFirst({
      where: { tituloProjeto: "Portal de Matrículas Académicas" }
    });
    if (!p1) {
      await prisma.projetoVitrine.create({
        data: {
          idDisciplina: 1,
          tituloProjeto: "Portal de Matrículas Académicas",
          descricao: "Um sistema completo feito em Next.js e Prisma para gerir inscrições, turmas e históricos académicos na faculdade de engenharia.",
          urlRepositorio: "https://github.com/mariosilva/portal-matriculas",
          urlDemonstracao: "https://matriculas.kimpavita.ao",
          autores: {
            create: [
              { idUsuario: studentIds[0] },
              { idUsuario: studentIds[2] } // Mario and Carlos
            ]
          }
        }
      });
    }

    const p2 = await prisma.projetoVitrine.findFirst({
      where: { tituloProjeto: "Chat em Tempo Real com Socket.IO" }
    });
    if (!p2) {
      await prisma.projetoVitrine.create({
        data: {
          idDisciplina: 1,
          tituloProjeto: "Chat em Tempo Real com Socket.IO",
          descricao: "Aplicação SPA que permite comunicação instantânea entre alunos e docentes com envio de ficheiros e mensagens de voz.",
          urlRepositorio: "https://github.com/anasousa/socket-chat",
          autores: {
            create: [
              { idUsuario: studentIds[1] } // Ana
            ]
          }
        }
      });
    }

    // 5. Create Vagas / Opportunities
    let op1 = await prisma.oportunidadeAcademica.findFirst({
      where: { titulo: "Estágio em Desenvolvimento Fullstack Next.js" }
    });
    if (!op1) {
      op1 = await prisma.oportunidadeAcademica.create({
        data: {
          titulo: "Estágio em Desenvolvimento Fullstack Next.js",
          descricao: "Buscamos estudantes motivados para atuar no desenvolvimento de portais académicos colaborativos utilizando Next.js 15, Prisma e PostgreSQL.",
          tipo: "estagio",
          empresa: "KimpaTech Soluções",
          requisitos: "Conhecimento intermédio em React, TypeScript e Tailwind CSS. Ter bons resultados em lógica de programação.",
          dataLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days limit
          criadoPor: idProfessor
        }
      });
    }

    let op2 = await prisma.oportunidadeAcademica.findFirst({
      where: { titulo: "Bolsista de Investigação Científica em IA" }
    });
    if (!op2) {
      op2 = await prisma.oportunidadeAcademica.create({
        data: {
          titulo: "Bolsista de Investigação Científica em IA",
          descricao: "Pesquisa aplicada ao proctoring avançado e segurança anti-fraude em exames universitários online utilizando visão computacional.",
          tipo: "pesquisa",
          empresa: "Laboratório de Engenharia Kimpa Vita",
          requisitos: "Gosto por Machine Learning, Python, OpenCV. Ser aluno de 3º ou 4º ano.",
          dataLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          criadoPor: idProfessor
        }
      });
    }

    // Ensure student candidatures exist
    const cand1 = await prisma.candidaturaOportunidade.findFirst({
      where: { idOportunidade: op1.idOportunidade, idUsuario: studentIds[0] }
    });
    if (!cand1) {
      await prisma.candidaturaOportunidade.create({
        data: {
          idOportunidade: op1.idOportunidade,
          idUsuario: studentIds[0],
          estado: "pendente"
        }
      });
    }

    const cand2 = await prisma.candidaturaOportunidade.findFirst({
      where: { idOportunidade: op1.idOportunidade, idUsuario: studentIds[1] }
    });
    if (!cand2) {
      await prisma.candidaturaOportunidade.create({
        data: {
          idOportunidade: op1.idOportunidade,
          idUsuario: studentIds[1],
          estado: "entrevistado"
        }
      });
    }

    const cand3 = await prisma.candidaturaOportunidade.findFirst({
      where: { idOportunidade: op2.idOportunidade, idUsuario: studentIds[2] }
    });
    if (!cand3) {
      await prisma.candidaturaOportunidade.create({
        data: {
          idOportunidade: op2.idOportunidade,
          idUsuario: studentIds[2],
          estado: "rejeitado"
        }
      });
    }

    // 6. Create Notifications for the teacher
    await prisma.notificacao.deleteMany({
      where: { idUsuario: idProfessor }
    });

    await prisma.notificacao.createMany({
      data: [
        {
          idUsuario: idProfessor,
          titulo: "Novo Projeto Submetido para Aprovação",
          mensagem: "O estudante Mário Silva Uíge submeteu o projeto 'Portal de Matrículas Académicas' para a vitrine pública.",
          tipo: "aviso",
          prioridade: "normal"
        },
        {
          idUsuario: idProfessor,
          titulo: "Nova Candidatura de Estágio Recebida",
          mensagem: "Ana Sousa Cuanza submeteu a sua candidatura para a vaga de 'Estágio em Desenvolvimento Fullstack Next.js'.",
          tipo: "informacao",
          prioridade: "normal"
        },
        {
          idUsuario: idProfessor,
          titulo: "Irregularidade de Proctoring Grave Detetada",
          mensagem: "O monitor anti-fraude registou suspeita ALTA na tentativa de exame de Carlos Neto Informática devido a perda de foco recorrente (5x) e webcam com múltiplos rostos.",
          tipo: "alerta",
          prioridade: "alta"
        }
      ]
    });

    // 7. Ensure mock groups exist
    let g1 = await prisma.grupo.findFirst({
      where: { nomeGrupo: "Grupo de Trabalho A - Programação" }
    });
    if (!g1) {
      await prisma.grupo.create({
        data: {
          nomeGrupo: "Grupo de Trabalho A - Programação",
          tipoGrupo: "trabalho",
          idTurma: 1,
          idDisciplina: 1,
          idCriador: idProfessor,
          membros: {
            createMany: {
              data: [
                { idUsuario: idProfessor, funcaoNoGrupo: "admin" },
                { idUsuario: studentIds[0], funcaoNoGrupo: "admin" },
                { idUsuario: studentIds[2], funcaoNoGrupo: "membro" }
              ]
            }
          }
        }
      });
    }

    let g2 = await prisma.grupo.findFirst({
      where: { nomeGrupo: "Grupo de Mentoria de Algoritmos" }
    });
    if (!g2) {
      await prisma.grupo.create({
        data: {
          nomeGrupo: "Grupo de Mentoria de Algoritmos",
          tipoGrupo: "mentoria",
          idTurma: 1,
          idDisciplina: 1,
          idCriador: idProfessor,
          membros: {
            createMany: {
              data: [
                { idUsuario: idProfessor, funcaoNoGrupo: "admin" },
                { idUsuario: studentIds[3], funcaoNoGrupo: "mentor" },
                { idUsuario: studentIds[1], funcaoNoGrupo: "membro" }
              ]
            }
          }
        }
      });
    }

    // 8. Update Reputation
    const rep = await prisma.reputacaoAcademica.findFirst({
      where: { idUsuario: idProfessor }
    });
    if (rep) {
      await prisma.reputacaoAcademica.update({
        where: { idReputacao: rep.idReputacao },
        data: {
          pontos: 280,
          nivel: "prata",
          mentoriasRealizadas: 4,
          projetosPublicados: 2,
          feedbackPositivo: 8
        }
      });
    } else {
      await prisma.reputacaoAcademica.create({
        data: {
          idUsuario: idProfessor,
          pontos: 280,
          nivel: "prata",
          mentoriasRealizadas: 4,
          projetosPublicados: 2,
          feedbackPositivo: 8
        }
      });
    }

    return { success: true };
  }
}

