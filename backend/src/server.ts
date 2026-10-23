import { config } from "dotenv";
import { resolve } from "node:path";
import express, { ErrorRequestHandler, RequestHandler } from "express";
import cors from "cors";
import database, { User } from "@users/database";

config({ path: resolve(__dirname, "../.env"), quiet: true });

const app = express();
app.disable("x-powered-by");
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "https://next-crud-one-drab.vercel.app",
];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "16kb" }));

// A repository provides find, save, and delete methods for the users table.
const users = database.getRepository(User);

// Render can check this endpoint without fetching user records.
app.get("/health", async (_req, res) => {
  await database.query("SELECT 1");
  res.json({ status: "ok" });
});

// Check form values before creating or updating a user.
const validateUser: RequestHandler = (req, res, next) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const role = req.body?.role;

  if (!name || name.length > 100) {
    res.status(400).json({ message: "Name is required and must be 100 characters or less." });
    return;
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: "Enter a valid email address." });
    return;
  }
  if (!["admin", "editor", "viewer"].includes(role)) {
    res.status(400).json({ message: "Role must be admin, editor, or viewer." });
    return;
  }

  // Keep only the three fields the user is allowed to change.
  req.body = { name, email, role };
  next();
};

// A PostgreSQL UUID must look like this: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.
app.param("id", (_req, res, next, id) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    res.status(400).json({ message: "Invalid user ID." });
    return;
  }
  next();
});

// READ: return all users.
app.get("/api/users", async (_req, res) => {
  const allUsers = await users.find({ order: { createdAt: "DESC" } });
  res.json(allUsers);
});

// CREATE: save a new user.
app.post("/api/users", validateUser, async (req, res) => {
  const user = users.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  });
  await users.save(user);
  res.status(201).json(user);
});

// UPDATE: find the user, change their details, then save.
app.put("/api/users/:id", validateUser, async (req, res) => {
  const user = await users.findOneBy({ id: String(req.params.id) });
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  user.name = req.body.name;
  user.email = req.body.email;
  user.role = req.body.role;
  await users.save(user);
  res.json(user);
});

// DELETE: remove the user with this ID.
app.delete("/api/users/:id", async (req, res) => {
  const result = await users.delete(String(req.params.id));
  if (!result.affected) {
    res.status(404).json({ message: "User not found." });
    return;
  }
  res.status(204).send();
});

app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint not found." });
});

// Express 5 sends errors from the async routes above to this handler.
const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error.driverError?.code === "23505") {
    res.status(409).json({ message: "A user with this email already exists." });
    return;
  }
  if (error.type === "entity.parse.failed") {
    res.status(400).json({ message: "Invalid JSON body." });
    return;
  }
  if (error.type === "entity.too.large") {
    res.status(413).json({ message: "Request body is too large." });
    return;
  }
  console.error(error.message);
  res.status(500).json({ message: "Unable to complete the request. Please try again." });
};
app.use(handleError);

// Connect to PostgreSQL before accepting API requests.
async function startServer() {
  await database.initialize();
  const port = Number(process.env.PORT || 4000);
  const server = app.listen(port, "0.0.0.0", () => console.log(`Backend listening on port ${port}`));

  // Finish current requests and close PostgreSQL connections before stopping.
  function shutdown() {
    server.close(() => {
      database.destroy().then(() => process.exit(0)).catch(() => process.exit(1));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}

startServer().catch(error => {
  console.error("Could not start backend:", error.message);
  process.exit(1);
});
