// utils/parseForm.ts
import type { NextApiRequest } from "next";
import formidable, { Fields, Files } from "formidable";

export const parseForm = (
  req: NextApiRequest
): Promise<{ fields: Fields; files: Files }> => {
  const form = formidable({
    uploadDir: "./tmp",
    keepExtensions: true,
    multiples: false,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};
