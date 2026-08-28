import express from "express";
import "dotenv/config";
import swaggerUi from "swagger-ui-express";
import { spec } from "./swagger.js";
import { authRouter } from "./routes/auth.js";
import { landingRouter } from "./routes/landing.js";
import { requireRole } from "./middlewares/requireRole.js";
import { userRouter } from "./routes/users.js";
import { applicationRouter } from "./routes/applications.js";
import { userApplicationRouter } from "./routes/userApplications.js";
import { auth } from "./middlewares/auth.js";

const app = express();
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

// auth
app.use("/auth/logout", auth);
app.use("/auth", authRouter)
app.use("/landing", auth, landingRouter)
app.use("/users/:id/applications", auth, requireRole("Admin"), userApplicationRouter)
app.use("/users", auth, requireRole("Admin"), userRouter)
app.use("/applications", auth, requireRole("Admin"), applicationRouter)

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(3000, () => console.log("API on http://localhost:3000 (docs at /docs)"));
