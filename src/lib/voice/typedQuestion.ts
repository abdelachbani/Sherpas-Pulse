/** Build the relay's conversation turn for a typed question. */
export function typedQuestionMessages(question: string) {
  const text = question.trim();
  if (!text) return [];
  return [
    { type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } },
    { type: 'response.create' },
  ];
}
