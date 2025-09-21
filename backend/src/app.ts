import express, { Request, Response } from "express";
import EventController from "./controllers/Event.controller";
import AuthController from "./controllers/Auth.controller";
import { expressjwt } from "express-jwt";
import { apiRateLimiter } from "./middleware/rate-limit.middleware";
import helmet from "helmet";
import cors from "cors";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: "http://localhost:3001" }));

app.get("/", (req: Request, res: Response) => {
  res.send("Event processing service is running!");
});

app.post("/auth/token", apiRateLimiter, AuthController.generateToken);
app.post(
  "/events",
  apiRateLimiter,
  expressjwt({ secret: JWT_SECRET, algorithms: ["HS256"] }),
  EventController.handleEvent,
);

export default app;
