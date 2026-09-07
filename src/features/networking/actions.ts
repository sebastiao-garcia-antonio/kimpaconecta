"use server";

import { NetworkingRepository } from "./repositories/networking.repository";

export async function processAction(id: number) {
  try {
    const data = await NetworkingRepository.getEntity(id);
    return { success: true, data };
  } catch (error) {
    return { error: "Action error" };
  }
}
