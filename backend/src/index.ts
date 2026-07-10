import "dotenv/config";
import express from "express";
import cors from "cors";
import importRouter from "./routes/import";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", importRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`GrowEasy CSV Importer backend listening on port ${PORT}`);
});
