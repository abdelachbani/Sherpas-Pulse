/**
 * src/lib/multiTouchCadence.ts
 *
 * Multi-Touch Re-engagement Engine:
 * Answers Borja's exact hackathon rubric challenge:
 * "What happens on day 3, when the doubts come? And on day 30?"
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
  firstWinDollars: string;
  agreedTopic?: string;
  divergedTopic?: string;
}): Touchpoint[] {
  const {
    clientNames,
    primaryHesitationTerm,
    firstWinTitle,
    firstWinDollars,
    agreedTopic = 'liquidating high-interest card balance',
    divergedTopic = 'College Savings (529) vs. Umbrella Liability Shield',
  } = params;

  return [
    {
      id: 'day-1',
      day: 1,
      label: 'Day 1: The 5-Minute Win',
      badge: 'Immediate Action',
      purpose: 'Lock in the single highest-ROI action while motivation is at its peak.',
      hasCalendarInvite: true,
      whatsappText: `Hi ${clientNames}! 👋 Great job reviewing your Sherpas financial plan today. Your easiest first victory is ready: ${firstWinTitle}. Taking 5 minutes today locks in ${firstWinDollars} in immediate annual benefit! Let us know if you need any help taking this first step.`,
      emailSubject: `Your 5-Minute Financial Win (${clientNames})`,
      emailBody: `Hi ${clientNames},\n\nThank you for exploring your Sherpas Financial Wrapped today!\n\nTo avoid getting overwhelmed by multiple recommendations, your advisor recommends focusing on ONE single first domino:\n\n👉 ${firstWinTitle}\n💰 Impact: ${firstWinDollars} back in your pocket each year.\n\nTake 5 minutes to complete this step today. We've attached a quick calendar reminder so you don't lose momentum.\n\nBest,\nYour Sherpas Advisory Team`,
    },
    {
      id: 'day-3',
      day: 3,
      label: 'Day 3: Doubt Calibrator',
      badge: 'Calibrate Hesitation',
      purpose: 'Proactively calibrate technical friction before doubts turn into inaction.',
      whatsappText: `Hi ${clientNames}, we noticed you were carefully reviewing ${primaryHesitationTerm} in your plan. It is completely normal to have questions about how that applies to your family! Here is the 20-second takeaway: it is designed specifically to protect your surplus cash without tying up your liquidity. Would you like us to explain this in 2 minutes on a quick call?`,
      emailSubject: `Quick clarification on ${primaryHesitationTerm} for your plan`,
      emailBody: `Hi ${clientNames},\n\nWhen families review their Sherpas plan, terms like "${primaryHesitationTerm}" frequently raise natural questions.\n\nWe saw you paused on this section during your review. In simple terms: for your specific household, this recommendation acts as a guardrail so unexpected life events don't derail your retirement horizon.\n\nNo need to stress about the technicalities—we've noted this as a priority point to walk through together when we meet.\n\nWarmly,\nYour Sherpas Advisory Team`,
    },
    {
      id: 'day-14',
      day: 14,
      label: 'Day 14: Alignment Check',
      badge: 'Couple Execution',
      purpose: 'Follow up on joint consensus tasks and celebrate mutual progress.',
      whatsappText: `Hi ${clientNames}! Quick 2-week check-in from Sherpas. Both of you were 100% aligned on ${agreedTopic}. Did you get a chance to execute that step? Knocking that off your plate protects your family's cash flow this month! 🙌`,
      emailSubject: `2-Week Progress Check-in: Your agreed priority`,
      emailBody: `Hi ${clientNames},\n\nIt's been two weeks since your plan sync. One of the highlights of your session was that you both agreed 100% on:\n\n✅ ${agreedTopic}\n\nHave you had a chance to submit this transfer or adjust your allocations? Getting this done before our upcoming strategy meeting will give us maximum momentum.\n\nFeel free to reply directly here with any updates!\n\nBest regards,\nYour Sherpas Advisory Team`,
    },
    {
      id: 'day-30',
      day: 30,
      label: 'Day 30: Meeting Blueprint',
      badge: 'Human Meeting Prep',
      purpose: 'Frame the Zoom conversation around human trade-offs, skipping slides entirely.',
      whatsappText: `Hi ${clientNames}! 📅 Our strategic Zoom review is around the corner. Because you already reviewed the numbers and completed your 5-minute win, we are SKIPPING the 40-minute slide deck recap! We will spend 100% of our time discussing your primary tie-breaker: ${divergedTopic}. See you soon!`,
      emailSubject: `Your Pre-Meeting Blueprint: Skipping the slides for what matters`,
      emailBody: `Hi ${clientNames},\n\nLooking forward to our upcoming strategy conversation!\n\nHere is how we do things differently at Sherpas:\nBecause you've already walked through your mobile Financial Wrapped and aligned on key priorities, we will NOT spend 40 minutes sharing our screen and reading static slides.\n\nInstead, our entire conversation will focus on the human side:\n1. Celebrating your completed action steps (${agreedTopic})\n2. Deep-diving into your primary trade-off: ${divergedTopic}\n3. Setting your 3-year living map roadmap in motion.\n\nSee you on Zoom!\n\nBest regards,\nYour Sherpas Advisory Team`,
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
