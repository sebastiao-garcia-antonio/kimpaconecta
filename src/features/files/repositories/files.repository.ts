import { prisma } from "@/lib/prisma";

export class FilesRepository {
  static async getEntity(id: number) {
    return { id, status: "ok" };
  }
}
