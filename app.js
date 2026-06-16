import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import 'dotenv/config'

import directoryRoutes from "./routes/directoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import webhook from "./routes/webhookRoutes.js";
import checkAuth from "./middlewares/authMiddleware.js";
import { connectDB } from "./config/db.js";
import { webhookVerify } from "./controllers/webhookControllers.js";

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
  res.status(200).json({ message: "jk" });
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
