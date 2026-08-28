import express from "express";
import "dotenv/config";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { spec } from "./swagger.js";
import { authRouter } from "./routes/auth.js";
import { landingRouter } from "./routes/landing.js";
import { requireRole } from "./middlewares/requireRole.js";
import { userRouter } from "./routes/users.js";
import { applicationRouter } from "./routes/applications.js";
import { roleRouter } from "./routes/roles.js";
import { userApplicationRouter } from "./routes/userApplications.js";
import { contactRouter } from "./routes/contacts.js";
import { auditLogRouter } from "./routes/auditLogs.js";
import { auth } from "./middlewares/auth.js";
import { requireApp } from "./middlewares/requireApp.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

// auth
app.use("/auth/logout", auth);
app.use("/auth", authRouter)
app.use("/landing", auth, landingRouter)
app.use("/users/:id/applications", auth, requireRole("Admin"), userApplicationRouter)
app.use("/users", auth, requireRole("Admin"), userRouter)
app.use("/applications", auth, requireRole("Admin"), applicationRouter)
app.use("/roles", auth, requireRole("Admin"), roleRouter)
app.use("/audit-logs", auth, requireRole("Admin"), auditLogRouter)
app.use("/contacts", auth, requireApp("Yellow Pages"), contactRouter)

app.get("/health", (_req, res) => res.json({ ok: true }));

// 404 — must be before errorHandler
app.use((_req, res) => res.status(404).json({ success: false, message: "Not found" }));

app.use(errorHandler);

app.listen(3000, () => console.log("API on http://localhost:3000 (docs at /docs)"));
