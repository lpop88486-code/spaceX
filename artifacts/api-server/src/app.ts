import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());

// Redirect non-www to www for spacexstarlink.com
app.use((req, res, next) => {
  const host = req.headers.host ?? "";
  if (host === "spacexstarlink.com" || host === "spacexstarlink.com:443") {
    const wwwUrl = `https://www.spacexstarlink.com${req.url}`;
    res.redirect(301, wwwUrl);
    return;
  }
  next();
});

// Stripe webhooks require the raw body for signature verification
app.use("/api/checkout/webhook", express.raw({ type: "application/json" }));

// All other routes get standard JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
