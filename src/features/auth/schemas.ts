import { z } from "zod";
import { REGEX_BI_ANGOLA } from "@/lib/validacao-texto";

export const loginSchema = z.object({
  identifier: z.string().min(1, "E-mail ou número de estudante é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export const registroSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  numEstudante: z.string().min(4, "Número de processo ou estudante inválido"),
  numBi: z
    .string()
    .refine((val) => !val || REGEX_BI_ANGOLA.test(val.trim()), {
      message: "Formato do BI inválido. Deve ter exatamente 14 caracteres (ex: 000000000UE000)",
    })
    .optional()
    .or(z.literal("")),
  telefone: z.string().min(7, "Telefone inválido").optional().or(z.literal("")),
  senhaProvisoria: z.string().min(6, "Mínimo de 6 caracteres"),
  idUo: z.union([z.number(), z.string()]),
  idCurso: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional(),
  idTurma: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional(),
});
