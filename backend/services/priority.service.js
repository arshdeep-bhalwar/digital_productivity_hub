/**
 * Priority Service - Deterministic Task Prioritization Engine
 * 
 * Score components (0 - 100 range):
 * 1. Deadline Proximity (0 - 40 pts)
 * 2. Importance Weight (0 - 25 pts)
 * 3. Workload Weight (0 - 20 pts)
 * 4. Delay / Age Weight (0 - 15 pts)
 */

const IMPORTANCE_WEIGHTS = {
  Critical: 25,
  High: 20,
  Medium: 12,
  Low: 5,
};

export function calculatePriorityScore(task, now = new Date()) {
  if (task.status === 'completed') {
    return {
      score: 0,
      level: 'Low',
      reason: 'Task is completed.',
    };
  }

  const currentDate = new Date(now);
  let deadlineScore = 0;
  let deadlineReason = 'No deadline set';

  if (task.deadline) {
    const deadlineDate = new Date(task.deadline);
    const diffHours = (deadlineDate - currentDate) / (1000 * 60 * 60);

    if (diffHours < 0) {
      // Overdue
      deadlineScore = 40;
      deadlineReason = `Overdue by ${Math.abs(Math.round(diffHours))} hours`;
    } else if (diffHours <= 12) {
      deadlineScore = 38;
      deadlineReason = 'Deadline is within 12 hours';
    } else if (diffHours <= 24) {
      deadlineScore = 35;
      deadlineReason = 'Deadline is within 24 hours';
    } else if (diffHours <= 48) {
      deadlineScore = 28;
      deadlineReason = 'Deadline is within 2 days';
    } else if (diffHours <= 120) {
      deadlineScore = 18;
      deadlineReason = 'Deadline is within 5 days';
    } else {
      deadlineScore = 8;
      deadlineReason = `Deadline is in ${Math.round(diffHours / 24)} days`;
    }
  }

  // Importance Score
  const importanceScore = IMPORTANCE_WEIGHTS[task.priority] || 12;

  // Workload Score (higher duration = slightly higher urgency to start early)
  const estMins = Number(task.estimated_minutes) || 0;
  let workloadScore = 0;
  if (estMins > 240) workloadScore = 20;
  else if (estMins > 120) workloadScore = 15;
  else if (estMins > 60) workloadScore = 10;
  else if (estMins > 0) workloadScore = 5;

  // Age / Delay Score (tasks created longer ago get slight boost)
  let delayScore = 0;
  if (task.created_at) {
    const createdDate = new Date(task.created_at);
    const ageDays = (currentDate - createdDate) / (1000 * 60 * 60 * 24);
    delayScore = Math.min(15, Math.floor(ageDays * 2));
  }

  const totalScore = Math.min(100, Math.max(0, deadlineScore + importanceScore + workloadScore + delayScore));

  let level = 'Low';
  if (totalScore >= 81) level = 'Critical';
  else if (totalScore >= 61) level = 'High';
  else if (totalScore >= 31) level = 'Medium';

  const reason = `${level}: ${deadlineReason} with ${importanceScore} Importance weight and ${estMins}m estimated effort.`;

  return {
    score: totalScore,
    level,
    reason,
  };
}
