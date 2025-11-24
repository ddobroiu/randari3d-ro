// /pages/api/feed.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { parse } from "csv-parse/sync";
import fetch from "node-fetch";

const FEED_URLS = [
  "https://api.2performant.com/feed/ed7f1a953.csv",
  "https://api.2performant.com/feed/463284e3c.csv",
  "https://api.2performant.com/feed/806d82d88.csv",
  "https://api.2performant.com/feed/7c6b865aa.csv",
  "https://api.2performant.com/feed/36cdab3d0.csv",
  "https://api.2performant.com/feed/eaa296496.csv",
  "https://api.2performant.com/feed/93379f6da.csv",
  "https://api.2performant.com/feed/568b6f9d4.csv",
];

interface FeedItem {
  title?: string;
  description?: string;
  image_urls?: string;
  price?: string;
  campaign_name?: string;
  aff_code?: string;
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const allProducts: FeedItem[] = [];

    for (const url of FEED_URLS) {
      const response = await fetch(url);
      if (!response.ok) continue;

      const csvText = await response.text();
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
      }) as FeedItem[];

      const valid = records
        .filter(
          (item) =>
            typeof item.image_urls === "string" &&
            item.image_urls.trim().startsWith("http")
        )
        .map((item) => ({
          title: item.title || "Produs fără titlu",
          description: item.description || "",
          image_urls: item.image_urls,
          price: item.price || "",
          currency: "RON",
          url: item.aff_code || "",   // ✅ folosim linkul de afiliere
          shop: item.campaign_name || "", // opțional: numele magazinului
          feed_id: url,
        }));

      allProducts.push(...valid);
    }

    // eliminăm duplicatele după titlu
    const unique = Array.from(
      new Map(allProducts.map((item) => [item.title, item])).values()
    );

    res.status(200).json(unique);
  } catch (err: any) {
    console.error("Eroare feed:", err);
    res.status(500).json({ error: "Eroare server", details: err.message });
  }
}
