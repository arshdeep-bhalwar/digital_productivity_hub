import * as geminiService from '../services/gemini.service.js';

export async function handleBrainDump(req, res, next) {
  try {
    const { text, today, timezone } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Brain dump text is required.',
        },
      });
    }

    try {
      const suggestedTasks = await geminiService.processBrainDump(text, { today, timezone });

      res.json({
        success: true,
        data: {
          tasks: suggestedTasks,
        },
        message: 'Brain dump processed successfully. Please review and confirm your tasks.',
      });
    } catch (aiErr) {
      // Graceful AI failure isolation (always 503 on AI failure)
      res.status(503).json({
        success: false,
        error: {
          code: aiErr.code || 'AI_SERVICE_ERROR',
          message: 'Productivity Assistant is temporarily unavailable. Your existing tasks and plans remain completely safe.',
          details: aiErr.message,
        },
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function handleAskAssistant(req, res, next) {
  try {
    const { question, tasks, goals } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Question is required.',
        },
      });
    }

    try {
      const answer = await geminiService.askAssistant(question, { tasks: tasks || [], goals: goals || [] });

      res.json({
        success: true,
        data: { answer },
      });
    } catch (aiErr) {
      res.status(503).json({
        success: false,
        error: {
          code: aiErr.code || 'AI_SERVICE_ERROR',
          message: 'Productivity Assistant is temporarily unavailable. Your existing tasks and plans remain completely safe.',
          details: aiErr.message,
        },
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function handleProjectBreakdown(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Project name is required.',
        },
      });
    }

    try {
      const subtasks = await geminiService.generateProjectBreakdown(name, description);

      res.json({
        success: true,
        data: { subtasks },
      });
    } catch (aiErr) {
      res.status(503).json({
        success: false,
        error: {
          code: aiErr.code || 'AI_SERVICE_ERROR',
          message: 'Productivity Assistant is temporarily unavailable. Your existing tasks and plans remain completely safe.',
          details: aiErr.message,
        },
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function handleStudyPlan(req, res, next) {
  try {
    const { subject, examDate, availableHours } = req.body;

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Subject is required.',
        },
      });
    }

    try {
      const studyBlocks = await geminiService.generateStudyPlan(subject, examDate, availableHours);

      res.json({
        success: true,
        data: { study_blocks: studyBlocks },
      });
    } catch (aiErr) {
      res.status(503).json({
        success: false,
        error: {
          code: aiErr.code || 'AI_SERVICE_ERROR',
          message: 'Productivity Assistant is temporarily unavailable. Your existing tasks and plans remain completely safe.',
          details: aiErr.message,
        },
      });
    }
  } catch (err) {
    next(err);
  }
}
