import * as analyticsService from '../services/analytics.service.js';

export async function getDashboard(req, res, next) {
  try {
    const data = await analyticsService.getDashboardAnalytics(req.supabase, req.user.id);
    res.json({
      success: true,
      data,
      message: 'Dashboard analytics retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getWeekly(req, res, next) {
  try {
    const data = await analyticsService.getWeeklyAnalytics(req.supabase, req.user.id);
    res.json({
      success: true,
      data,
      message: 'Weekly analytics retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductivityDNA(req, res, next) {
  try {
    const data = await analyticsService.getProductivityDNA(req.supabase, req.user.id);
    res.json({
      success: true,
      data,
      message: 'Productivity DNA profile retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
}
