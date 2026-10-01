import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

let genAI = null;

function getGenAI() {
  if (!genAI && config.geminiApiKey) {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
}

/**
 * Execute Gemini request with 1 retry and timeout protection
 */
async function callGeminiWithTimeout(prompt, timeoutMs = 12000) {
  const client = getGenAI();
  if (!client) {
    const err = new Error('Gemini API key is not configured.');
    err.code = 'AI_KEY_MISSING';
    throw err;
  }

  const modelName = config.geminiModel || 'gemini-2.5-flash';
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  let attempt = 0;
  const maxAttempts = 2; // 1 initial + 1 retry

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          const tErr = new Error('Gemini API request timed out.');
          tErr.code = 'AI_TIMEOUT';
          reject(tErr);
        }, timeoutMs);
      });

      const apiPromise = model.generateContent(prompt);
      const result = await Promise.race([apiPromise, timeoutPromise]);
      const responseText = result.response.text();
      return responseText;
    } catch (err) {
      if (attempt >= maxAttempts || err.code === 'AI_KEY_MISSING') {
        throw err;
      }
      // Wait 500ms before single retry
      await new Promise(res => setTimeout(res, 500));
    }
  }
}

/**
 * Process Brain Dump text into structured task suggestions
 */
export async function processBrainDump(text, userContext = {}) {
  const todayStr = userContext.today || new Date().toISOString().split('T')[0];
  const timezone = userContext.timezone || 'UTC';

  const prompt = `You are a student productivity assistant. Extract structured tasks from the following student brain dump.

Current Date: ${todayStr}
User Timezone: ${timezone}

Input Text: "${text}"

Respond strictly with a JSON object matching this schema:
{
  "tasks": [
    {
      "title": "Short descriptive task title",
      "description": "Optional details",
      "category": "Academic" | "Project" | "Career" | "Personal" | "Health" | "Other",
      "priority": "Low" | "Medium" | "High" | "Critical",
      "deadline": "YYYY-MM-DD" or null,
      "estimated_minutes": number (integer >= 15)
    }
  ]
}

Ensure "tomorrow", "this Friday", "next week", etc., are resolved relative to ${todayStr}.
Do not include markdown code block formatting in the raw text if possible, return raw JSON string.`;

  try {
    const rawOutput = await callGeminiWithTimeout(prompt);
    return parseAndValidateBrainDumpOutput(rawOutput);
  } catch (err) {
    console.error('[GEMINI BRAIN DUMP ERROR]', err.message);
    if (!err.code) {
      if (err.message && (err.message.includes('API key') || err.message.includes('API_KEY'))) {
        err.code = 'AI_KEY_MISSING';
      } else {
        err.code = 'AI_SERVICE_ERROR';
      }
    }
    throw err;
  }
}

/**
 * Validates and normalizes Gemini Brain Dump JSON output
 */
export function parseAndValidateBrainDumpOutput(rawOutput) {
  let cleaned = rawOutput.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const err = new Error('Malformed JSON output received from AI model.');
    err.code = 'AI_PARSE_ERROR';
    throw err;
  }

  if (!parsed || !Array.isArray(parsed.tasks)) {
    const err = new Error('Invalid task list structure in AI response.');
    err.code = 'AI_SCHEMA_ERROR';
    throw err;
  }

  const ALLOWED_CATEGORIES = ['Academic', 'Project', 'Career', 'Personal', 'Health', 'Other'];
  const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

  const normalizedTasks = parsed.tasks.map((t, index) => {
    if (!t.title || typeof t.title !== 'string') {
      throw new Error(`Task #${index + 1} is missing a valid title.`);
    }

    return {
      title: t.title.trim(),
      description: t.description || '',
      category: ALLOWED_CATEGORIES.includes(t.category) ? t.category : 'Academic',
      priority: ALLOWED_PRIORITIES.includes(t.priority) ? t.priority : 'Medium',
      deadline: t.deadline && /^\d{4}-\d{2}-\d{2}/.test(t.deadline) ? t.deadline : null,
      estimated_minutes: Math.max(15, Number(t.estimated_minutes) || 30),
    };
  });

  return normalizedTasks;
}

/**
 * Ask Productivity Assistant a question with context of user's active workload
 */
export async function askAssistant(question, userContext = {}) {
  const tasksSummary = (userContext.tasks || [])
    .slice(0, 10)
    .map(t => `- ${t.title} [Priority: ${t.priority}, Category: ${t.category}, Deadline: ${t.deadline || 'None'}, Est: ${t.estimated_minutes || 30}m]`)
    .join('\n');

  const goalsSummary = (userContext.goals || [])
    .map(g => `- ${g.title} (${g.progress || 0}% complete)`)
    .join('\n');

  const prompt = `You are an intelligent, empathetic, and direct student productivity assistant in Digital Productivity Hub.
Answer the user's question clearly, concisely, and practically. Suggest specific, actionable steps.

User Question: "${question}"

Current Active Tasks:
${tasksSummary || 'No pending tasks currently.'}

Active Goals:
${goalsSummary || 'No active goals currently.'}

Provide a helpful, direct response (max 3 short paragraphs or bullet points). Do not make any database changes.`;

  const rawOutput = await callGeminiWithTimeout(prompt);
  return rawOutput.trim();
}

/**
 * AI Project Decomposition - Suggests breakdown structure for a project
 */
export async function generateProjectBreakdown(projectName, projectDescription = '') {
  const prompt = `Decompose this student project into actionable subtasks.

Project Name: "${projectName}"
Description: "${projectDescription}"

Respond strictly with JSON schema:
{
  "subtasks": [
    {
      "title": "Subtask title",
      "estimated_minutes": number (15 to 180)
    }
  ]
}`;

  const rawOutput = await callGeminiWithTimeout(prompt);
  let cleaned = rawOutput.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

  let parsed = JSON.parse(cleaned);
  if (!parsed || !Array.isArray(parsed.subtasks)) {
    throw new Error('Invalid subtask structure from AI.');
  }

  return parsed.subtasks.map(st => ({
    title: String(st.title || 'Untitled Subtask').trim(),
    estimated_minutes: Math.max(15, Number(st.estimated_minutes) || 30),
  }));
}

/**
 * AI Study Plan Suggestions
 */
export async function generateStudyPlan(subject, examDate, availableHours = 3) {
  const prompt = `Create a structured study plan for exam preparation.

Subject/Exam: "${subject}"
Exam Date: "${examDate || 'Upcoming'}"
Available Daily Study Hours: ${availableHours} hours

Respond strictly with JSON schema:
{
  "study_blocks": [
    {
      "topic": "Topic title",
      "duration_minutes": number,
      "recommendation": "Brief study tip"
    }
  ]
}`;

  const rawOutput = await callGeminiWithTimeout(prompt);
  let cleaned = rawOutput.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

  let parsed = JSON.parse(cleaned);
  return parsed.study_blocks || [];
}

