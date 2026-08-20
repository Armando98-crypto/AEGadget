import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { autenticar, verificarRole } from "../middleware/auth.middleware";

const storage = multer.diskStorage({
  destination: path.resolve(__dirname, "../../uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens são aceites (jpg, png, webp, gif)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.post(
  "/",
  autenticar,
  verificarRole("ADMIN"),
  upload.array("imagens", 6),
  (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "Nenhum ficheiro enviado" });
      return;
    }

    const urls = files.map((f) => ({
      url: `/uploads/${f.filename}`,
      originalName: f.originalname,
      size: f.size,
    }));

    res.json({ imagens: urls });
  }
);

export default router;
