import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import { AdminService } from "./admin.service.js";

export const getChatLogs = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getChatLogs(req.query));
});

export const getChatLogById = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getChatLogById(req.params.id));
});

export const getAnalytics = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getAnalytics());
});

export const getTopIssues = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getTopIssues());
});

export const getDashboardSummary = asyncHandler(async (req, res) => {
  return sendSuccess(res, await AdminService.getDashboardSummary());
});

export const exportReport = asyncHandler(async (req, res) => {
  const report = await AdminService.exportReport(req.body);

  res.setHeader("Content-Type", report.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
  return res.send(report.content);
});
