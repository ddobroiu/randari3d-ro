import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const logPath = path.join(process.cwd(), "tmp", "analyze-image.log");
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const when = new Date().toISOString();
    fs.appendFileSync(logPath, `[${when}] test-endpoint-called method=${req.method} url=${req.url}\n`);
    return res.status(200).json({ ok: true, when });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
