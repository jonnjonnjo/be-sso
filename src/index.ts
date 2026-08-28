import express from "express";
import swaggerUi from "swagger-ui-express";
import { spec } from "./swagger.js";

const app = express();
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(3000, () => console.log("API on http://localhost:3000 (docs at /docs)"));
