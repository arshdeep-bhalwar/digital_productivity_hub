/**
 * Deadline Risk Engine - Deterministic Risk Assessment
 * 
 * Assesses whether task/project work can be completed before deadline
 * given available productive time.
 */

export function calculateDeadlineRisk(task, availableMinutesPerDay = 240, now = new Date()) {
  if (!task) {
    return {
      level: 'Low',
      score: 0,
      explanation: 'No task details available.',
      remainingHours: 0,
      availableHours: 0,
    };
  }

  if (task.status === 'completed') {
    return {
      level: 'Low',
      score: 0,
      explanation: 'Task is completed.',
      remainingHours: 0,
      availableHours: 0,
    };
  }

  if (!task.deadline) {
    return {
      level: 'Low',
      score: 0,
      explanation: 'No deadline specified for this task.',
      remainingHours: Math.round(((task.estimated_minutes || 0) / 60) * 10) / 10,
      availableHours: 0,
    };
  }

  const currentDate = new Date(now);
  const deadlineDate = new Date(task.deadline);
  const totalDiffHours = (deadlineDate - currentDate) / (1000 * 60 * 60);

  if (totalDiffHours < 0) {
    const formattedDate = deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      level: 'Critical',
      score: 100,
      explanation: `Critical Risk: Overdue. Deadline passed on ${formattedDate}.`,
      remainingHours: Math.round(((task.estimated_minutes || 0) / 60) * 10) / 10,
      availableHours: 0,
    };
  }

  const daysRemaining = Math.max(0.1, totalDiffHours / 24);
  const dailyProductiveHours = (availableMinutesPerDay || 240) / 60;
  
  // Available focus hours before deadline
  const availableHours = Math.round(daysRemaining * dailyProductiveHours * 10) / 10;
  const remainingHours = Math.round(((task.estimated_minutes || 60) / 60) * 10) / 10;

  if (remainingHours === 0) {
    return {
      level: 'Low',
      score: 10,
      explanation: 'Low Risk: No remaining workload estimated.',
      remainingHours: 0,
      availableHours,
    };
  }

  const ratio = availableHours > 0 ? remainingHours / availableHours : 2.0;

  let level = 'Low';
  let score = 20;

  if (ratio >= 1.5 || availableHours === 0) {
    level = 'Critical';
    score = 90;
  } else if (ratio > 1.0) {
    level = 'High';
    score = 75;
  } else if (ratio > 0.7) {
    level = 'Medium';
    score = 45;
  }

  const explanation = level === 'Low'
    ? `Low Risk: about ${remainingHours}h of work remaining, ${availableHours}h available before deadline.`
    : `${level} Risk: about ${remainingHours}h of work remaining, ${availableHours}h available before the deadline.`;

  return {
    level,
    score,
    explanation,
    remainingHours,
    availableHours,
  };
}
