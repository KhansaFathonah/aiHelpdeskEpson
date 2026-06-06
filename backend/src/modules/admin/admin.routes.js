import express from "express";

import {
  getAnalytics,
  getChatLogById,
  getChatLogs,
  getDashboardSummary,
  getTopIssues,
  exportReport,
} from "./admin.controller.js";

const router = express.Router();

router.get("/chat-logs", getChatLogs);
router.get("/chat-logs/:id", getChatLogById);
router.get("/dashboard-summary", getDashboardSummary);
router.get("/analytics", getAnalytics);
router.get("/top-issues", getTopIssues);
router.post("/reports/export", exportReport);

export default router;
