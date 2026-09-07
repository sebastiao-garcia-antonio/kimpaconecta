"use server";

import { FilesRepository } from "./repositories/files.repository";

export async function processAction(id: number) {
  try {
    const data = await FilesRepository.getEntity(id);
    return { success: true, data };
  } catch (error) {
    return { error: "Action error" };
  }
}
