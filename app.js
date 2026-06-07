import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import directoryRoutes from "./routes/directoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import webhook from "./routes/webhookRoutes.js";
import checkAuth from "./middlewares/authMiddleware.js";
import { connectDB } from "./config/db.js";
import { webhookVerify } from "./controllers/webhookControllers.js";
import { spawn } from "child_process";
import crypto from "crypto";

await connectDB();

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  webhookVerify,
);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "in progress" });
});

app.post("/github-webhook", (req, res) => {
  console.log(req.body.repository.name);

  let repoName;
  if (req.body.repository.name === "storage-app-frontend") {
    repoName = "frontend";
  } else if (req.body.repository.name === "storage-app-backend") {
    repoName = "backend";
  }

  const givenSignature = req.headers["x-hub-signature-256"];

  if (!givenSignature) {
    return res.status(403).json({ error: "invalid signature" });
  }

  const calculatedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", "asim@123")
      .update(JSON.stringify(req.body))
      .digest("hex");

  if (givenSignature !== calculatedSignature) {
    return res.status(403).json({ error: "invalid signature" });
  }

  res.json({ message: "req received" });

  const childprocess = spawn("bash", [`/home/ubuntu/deploy-${repoName}.sh`]);

  childprocess.stdout.on("data", (data) => {
    process.stdout.write(data);
  });

  childprocess.stderr.on("data", (data) => {
    process.stderr.write(data);
  });

  childprocess.on("close", (code) => {
    console.log("code", code);
    if (code === 0) {
      console.log("script passed");
    } else {
      console.log("script failed");
    }
  });

  childprocess.on("error", (err) => {
    console.log(err);
  });
});

app.use("/directory", checkAuth, directoryRoutes);
app.use("/file", checkAuth, fileRoutes);
app.use("/", userRoutes);
app.use("/auth", authRoutes);
app.use("/subscriptions", checkAuth, subscriptionRoutes);
app.use("/webhooks", webhook);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).json({ error: err });
});

app.listen(PORT, () => {
  console.log(`Server Started`);
});
// export default app;
