import { getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import {
  ConnectTruthLensWhatsAppResponse,
  DisconnectTruthLensWhatsAppResponse,
  GetTruthLensDashboardResponse,
} from "@workspace/api-zod";
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getDashboardSnapshot,
} from "../lib/truthlens-whatsapp";

const router: IRouter = Router();

router.use("/truthlens", (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign-in required" });
    return;
  }
  next();
});

router.get("/truthlens/dashboard", (_req, res): void => {
  res.json(GetTruthLensDashboardResponse.parse(getDashboardSnapshot()));
});

router.post("/truthlens/whatsapp/connect", async (_req, res): Promise<void> => {
  try {
    const result = await connectWhatsApp();
    res.json(ConnectTruthLensWhatsAppResponse.parse(result));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start WhatsApp.";
    res.status(500).json({ error: message });
  }
});

router.post(
  "/truthlens/whatsapp/disconnect",
  async (_req, res): Promise<void> => {
    try {
      const result = await disconnectWhatsApp();
      res.json(DisconnectTruthLensWhatsAppResponse.parse(result));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not disconnect WhatsApp.";
      res.status(500).json({ error: message });
    }
  },
);

export default router;