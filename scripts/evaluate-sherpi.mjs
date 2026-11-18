import { WebSocket } from 'ws';

const base = process.argv[2] ?? 'ws://127.0.0.1:3001/voice';
const model = process.argv[3] ?? 'gemini-3.8-live';
const questionFilter = process.argv[4] ? new RegExp(process.argv[4], 'i') : null;
const fixtures = [
  {
    caseId: 'timothy-melanie-weah',
    question: 'How much does the car cost?',
    expected: /45[,. ]?000|forty[ -]five thousand/i,
    forbidden: /47[,. ]?740|600[,. ]?000|sixty out of a hundred/i,
  },
  {
    caseId: 'timothy-melanie-weah',
    question: 'When can we buy the car?',
    expected: /July.{0,15}(?:2028|twenty twenty[ -]eight)/i,
    forbidden: /2030|guarantee you can/i,
  },
  {
    caseId: 'timothy-melanie-weah',
    question: '¿Cuánto cuesta el coche?',
    expected: /45[,. ]?000|cuarenta y cinco mil/i,
    forbidden: /47[,. ]?740|600[,. ]?000|would you/i,
  },
  {
    caseId: 'timothy-melanie-weah',
    question: 'Cuándo me podré comprar el coche?',
    expected: /julio.{0,18}(?:2028|dos mil veintiocho)/i,
    forbidden: /2030|would you/i,
  },
  {
    caseId: 'timothy-melanie-weah',
    question: 'What is the projected price of the car at the purchase date?',
    expected: /47[,. ]?740|forty[ -]seven thousand seven hundred forty/i,
    forbidden: /600[,. ]?000|guaranteed/i,
  },
  {
    caseId: 'michael-carter',
    question: 'When can I buy a car?',
    expected: /no .*?(?:car|vehicle)|(?:does(?: not|n.t)|isn.t|not).*?(?:car|vehicle|purchase date)/i,
    forbidden: /2028|45[,. ]?000/i,
  },
  {
    caseId: 'timothy-melanie-weah',
    question: 'How much will it cost to fix my current car next year?',
    expected: /does(?: not|n.t)|plan.*(?:lack|no|not)|cannot|can.t/i,
    forbidden: /\b45[,. ]?000\b|forty[ -]five thousand/i,
  },

  {
    caseId: 'timothy-melanie-weah',
    question: 'What is the current balance of my Chase card?',
    expected: /18[,. ]?000|eighteen thousand/i,
    forbidden: /6[,. ]?800|six thousand eight hundred|sixty out of a hundred/i,
  },
  {
    caseId: 'timothy-melanie-weah',
    question: 'How much does the plan recommend paying toward my Chase card?',
    expected: /6[,. ]?800|six thousand eight hundred/i,
    forbidden: /18[,. ]?000|eighteen thousand/i,
  },
  {
    caseId: 'daniel-emily-johnson',
    question: 'What is our Financial Health score?',
    expected: /52|fifty[ -]two/i,
    forbidden: /1[,. ]?166[,. ]?000|life cover|mortality/i,
  },
  {
    caseId: 'michael-carter',
    question: 'Does the plan confirm I can afford the house?',
    expected: /does(?: not|n.t)|cannot|can.t|not establish|not confirm/i,
    forbidden: /yes[, ]+you can/i,
  },
  {
    caseId: 'samantha-lewis',
    question: 'What amount is listed for my home purchase goal?',
    expected: /500[,. ]?000|five hundred thousand/i,
    forbidden: /82 out of|eighty.two out of/i,
  },
  {
    caseId: 'timothy-melanie-weah',
    question: 'What financial health score is in the Samantha Lewis plan?',
    expected: /open plan|current plan|only.*(?:your|this|open).*plan/i,
    forbidden: /\b(?:82|60)\b|eighty[ -]two|sixty/i,
  },
  {
    caseId: 'michael-carter',
    question: 'How much will it cost to repair my car next year?',
    expected: /does(?: not|n.t)|plan.*(?:lack|no|not)|cannot|can.t/i,
    forbidden: /\$\s*\d/,
  },
];

function evaluate(fixture) {
  return new Promise(resolve => {
    const url = new URL(base);
    url.searchParams.set('case', fixture.caseId);
    url.searchParams.set('model', model);
    const socket = new WebSocket(url);
    const send = event => socket.send(JSON.stringify(event));
    let reply = '';
    let started = false;
    let complete = false;
    let providerCode;
    let audioChunks = 0;
    const timeout = setTimeout(() => finish('timeout'), 25_000);

    function finish(status) {
      if (complete) return;
      complete = true;
      clearTimeout(timeout);
      socket.close();
      const answer = reply.trim();
      const direct = fixture.expected.test(answer) && !fixture.forbidden.test(answer);
      const followUp = answer.endsWith('?') && (answer.match(/\?/g) ?? []).length === 1;
      const short = answer.split(/\s+/).length <= 65;
      resolve({ model, providerCode, audioChunks, question: fixture.question, caseId: fixture.caseId, status, direct, followUp, short, answer,
        pass: status === 'completed' && direct && followUp && short });
    }

    socket.on('open', () => send({
      type: 'session.update',
      session: {
        type: 'realtime',
        audio: {
          input: { format: { type: 'audio/pcm', rate: 24000 }, turn_detection: null },
          output: { format: { type: 'audio/pcm', rate: 24000 }, voice: 'marin' },
        },
      },
    }));

    socket.on('message', data => {
      const event = JSON.parse(data.toString());
      if (event.type === 'session.updated' && !started) {
        started = true;
        send({ type: 'conversation.item.create', item: {
          type: 'message', role: 'user', content: [{ type: 'input_text', text: fixture.question }],
        } });
        send({ type: 'response.create' });
      } else if (/^response\.(?:output_audio_transcript|audio_transcript|output_text|text)\.delta$/.test(event.type)) {
        reply += event.delta;
      } else if (/^response\.(?:output_audio|audio)\.delta$/.test(event.type)) {
        audioChunks++;
      } else if (event.type === 'response.done') {
        finish(event.response?.status ?? 'completed');
      } else if (event.type === 'error') {
        providerCode = event.error?.code ?? event.error?.type;
        finish('provider-error');
      }
    });
    socket.on('error', () => finish('connection-error'));
    socket.on('close', () => finish('closed'));
  });
}

const selected = questionFilter ? fixtures.filter(fixture => questionFilter.test(fixture.question)) : fixtures;
if (!selected.length) throw new Error('No questions matched the evaluation filter.');
const results = [];
for (let index = 0; index < selected.length; index += 2) {
  const batch = await Promise.all(selected.slice(index, index + 2).map(evaluate));
  for (const result of batch) console.log(JSON.stringify(result));
  results.push(...batch);
}
process.exitCode = results.every(result => result.pass) ? 0 : 1;
