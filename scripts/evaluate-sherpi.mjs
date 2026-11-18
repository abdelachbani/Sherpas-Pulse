import { WebSocket } from 'ws';

const base = process.argv[2] ?? 'ws://127.0.0.1:3001/voice';
const fixtures = [
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
    url.searchParams.set('model', 'gemini-3.8-live');
    const socket = new WebSocket(url);
    const send = event => socket.send(JSON.stringify(event));
    let reply = '';
    let started = false;
    let complete = false;
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
      resolve({ question: fixture.question, caseId: fixture.caseId, status, direct, followUp, short, answer,
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
      } else if (event.type === 'response.done') {
        finish(event.response?.status ?? 'completed');
      } else if (event.type === 'error') {
        finish('provider-error');
      }
    });
    socket.on('error', () => finish('connection-error'));
    socket.on('close', () => finish('closed'));
  });
}

const results = [];
for (let index = 0; index < fixtures.length; index += 2) {
  results.push(...await Promise.all(fixtures.slice(index, index + 2).map(evaluate)));
}
for (const result of results) console.log(JSON.stringify(result));
process.exitCode = results.every(result => result.pass) ? 0 : 1;
