"use server";

import { AnalyticsRepository } from "./repositories/analytics.repository";

export async function processAction(id: number) {
  try {
    const data = await AnalyticsRepository.getEntity(id);
    return { success: true, data };
  } catch (error) {
    return { error: "Action error" };
  }
}
