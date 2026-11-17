/**
 * src/lib/multiTouchCadence.ts
 *
 * Multi-Touch Re-engagement Engine:
 * Manages the multi-touch client journey across Days 1, 3, 14, and 30.
 *
 * Delivers a 4-phase cadence:
 * - Day 1:  The 5-Minute Win Action & Calendar reminder (.ics)
 * - Day 3:  The Doubt Calibrator (personalized to hesitation telemetry)
 * - Day 14: Couple Alignment Check-in (focusing on agreed Green Zone tasks)
 * - Day 30: Pre-Meeting Human Alignment (framing the human Zoom conversation)
 */

export interface Touchpoint {
  id: 'day-1' | 'day-3' | 'day-14' | 'day-30';
  day: number;
  label: string;
  badge: string;
  purpose: string;
  whatsappText: string;
  emailSubject: string;
  emailBody: string;
  hasCalendarInvite?: boolean;
}

export function generateMultiTouchCadence(params: {
  caseId: string;
  clientNames: string;
  primaryHesitationTerm: string;
  firstWinTitle: string;
  firstWinDollars?: string;
  agreedTopic?: string;
  divergedTopic?: string;
}): Touchpoint[] {
  const {
    clientNames,
    primaryHesitationTerm,
    firstWinTitle,
    firstWinDollars,
    agreedTopic = 'the priorities in your plan',
    divergedTopic = 'the decisions you would like help with',
  } = params;

  return [
    {
      id: 'day-1',
      day: 1,
      label: 'Day 1: The 5-Minute Win',
      badge: 'Immediate Action',
      purpose: 'Lock in the single highest-ROI action while motivation is at its peak.',
      hasCalendarInvite: true,
      whatsappText: `Hi ${clientNames}, here’s one step to review from your Sherpas plan: ${firstWinTitle}.${firstWinDollars ? ` The plan lists ${firstWinDollars} for this step.` : ''} Let us know if you have questions about getting started.`,
      emailSubject: `Your 5-Minute Financial Win (${clientNames})`,
      emailBody: `Hi ${clientNames},\n\nHere’s one step from your Sherpas plan to review before we meet:\n\n${firstWinTitle}${firstWinDollars ? `\nAmount listed: ${firstWinDollars}.` : ''}\n\nSet aside five minutes to read through it and note anything you’d like to ask us.\n\nBest,\nYour Sherpas Advisory Team`,
    },
    {
      id: 'day-3',
      day: 3,
      label: 'Day 3: Doubt Calibrator',
      badge: 'Calibrate Hesitation',
      purpose: 'Proactively calibrate technical friction before doubts turn into inaction.',
      whatsappText: `Hi ${clientNames}, would you like to talk through ${primaryHesitationTerm} before we meet? Let us know what you’d like us to explain.`,
      emailSubject: `Quick clarification on ${primaryHesitationTerm} for your plan`,
      emailBody: `Hi ${clientNames},\n\nWe can spend a few minutes walking through ${primaryHesitationTerm} before we meet. If you have questions about how this fits into your plan, reply here and we’ll review them together.\n\nWarmly,\nYour Sherpas Advisory Team`,
    },
    {
      id: 'day-14',
      day: 14,
      label: 'Day 14: Alignment Check',
      badge: 'Couple Execution',
      purpose: 'Follow up on joint consensus tasks and celebrate mutual progress.',
      whatsappText: `Hi ${clientNames}, how is it going with ${agreedTopic}? Let us know what you’ve tried so far and what you’d like help with.`,
      emailSubject: 'Your two-week plan check-in',
      emailBody: `Hi ${clientNames},\n\nWe’d like to check in on ${agreedTopic}. Which next step feels manageable, and is there anything you’d like to talk through?\n\nBest,\nYour Sherpas Advisory Team`,
    },
    {
      id: 'day-30',
      day: 30,
      label: 'Day 30: Meeting Blueprint',
      badge: 'Human Meeting Prep',
      purpose: 'Frame the Zoom conversation around human trade-offs, skipping slides entirely.',
      whatsappText: `Hi ${clientNames}, before our next meeting, let us know if there’s anything you’d like to add to the agenda. We can start with ${divergedTopic}.`,
      emailSubject: 'Preparing for your Sherpas meeting',
      emailBody: `Hi ${clientNames},\n\nFor our next meeting, we can review ${agreedTopic} and talk through ${divergedTopic}. If any questions or changes have come up, send them over so we can prepare.\n\nSee you soon,\nYour Sherpas Advisory Team`,
    },
  ];
}

/**
 * Generates and triggers download of a standards-compliant .ics Calendar invite
 */
export function downloadCalendarInvite(params: {
  title: string;
  description: string;
  clientNames: string;
}) {
  const now = new Date();
  // Schedule for tomorrow at 10:00 AM local time
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
  const endDate = new Date(startDate.getTime() + 15 * 60 * 1000); // 15 mins

  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sherpas Pulse//Financial 5-Minute Win//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:sherpas-win-${Date.now()}@sherpaspulse.ai`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:🎯 Sherpas 5-Minute Win: ${params.title}`,
    `DESCRIPTION:${params.description.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT10M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Complete your 5-Minute Financial Win with Sherpas',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'sherpas-5-minute-win.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
