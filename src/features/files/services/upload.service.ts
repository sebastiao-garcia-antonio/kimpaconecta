import fs from "fs/promises";
import path from "path";

export class UploadService {
  private static uploadDir = path.join(process.cwd(), "public", "uploads");

  static async uploadFile(file: File): Promise<string> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const finalPath = path.join(this.uploadDir, uniqueName);

    await fs.writeFile(finalPath, buffer);
    return "/uploads/" + uniqueName;
  }
}
