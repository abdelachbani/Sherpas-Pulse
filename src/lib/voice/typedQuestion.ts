/** Build the relay's conversation turn for a typed question. */
export function typedQuestionMessages(question: string, previousQuestion?: string) {
  const text = question.trim();
  if (!text) return [];
  const context = previousQuestion?.trim().slice(0, 500);
  const input = context
    ? `Previous question (context only): ${JSON.stringify(context)}\nCurrent question: ${text}`
    : text;
  return [
    { type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: input }] } },
    { type: 'response.create' },
  ];
}
