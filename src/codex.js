import { spawn } from 'node:child_process';
import { selectExecution } from './model-policy.js';

export function codexArguments({ cwd, task, risk, failedAttempts, policy, availableModels, judge = false }) {
  if (!cwd) throw Error('Codex workspace required');
  if (judge && task && task !== 'review') throw Error('Judge can only execute review');
  const execution = selectExecution({ task: judge ? 'review' : task, risk, failedAttempts, policy, availableModels });
  if (execution.kind !== 'model') throw Error(`${execution.kind}: ${execution.reason}`);
  return {
    execution,
    args: ['exec', '--ignore-user-config', '--ephemeral', '--sandbox', execution.sandbox,
      '--model', execution.model, '-c', `model_reasoning_effort="${execution.reasoningEffort}"`,
      '--json', '-C', cwd, '-'],
  };
}

// Runs on the chosen worker host, including Vercel Sandbox. Not a Codex Cloud API.
export function executeCodex({ cwd, prompt, signal, timeoutMs = 300000, binary = 'codex', ...selection }) {
  const { args, execution } = codexArguments({ cwd, ...selection });
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw Error('Positive execution timeout required');
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ['pipe', 'pipe', 'pipe'], signal, timeout: timeoutMs, killSignal: 'SIGTERM' });
    const events = [];
    let pending = '', bytes = 0, usage = null;
    function consume(line) {
      if (!line.trim()) return;
      try {
        const event = JSON.parse(line);
        events.push(event);
        if (event.type === 'turn.completed' && event.usage) {
          const keys = ['input_tokens', 'cached_input_tokens', 'output_tokens'];
          if (keys.every(key => Number.isInteger(event.usage[key]) && event.usage[key] >= 0)) {
            usage ??= { input_tokens: 0, cached_input_tokens: 0, output_tokens: 0 };
            for (const key of keys) usage[key] += event.usage[key];
          }
        }
      } catch { events.push({ type: 'unparsed_output' }); }
    }
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > 10_000_000) { child.kill(); return; }
      pending += chunk;
      let index;
      while ((index = pending.indexOf('\n')) >= 0) {
        consume(pending.slice(0, index));
        pending = pending.slice(index + 1);
      }
    });
    // Drain stderr without publishing potentially sensitive provider diagnostics.
    child.stderr.resume();
    child.on('error', reject);
    child.on('close', (code, signal) => {
      consume(pending);
      resolve({ code, signal, events, execution, usage: usage ?? 'unavailable', cost: 'unavailable',
        durationMs: Date.now() - startedAt,
        diagnostic: code === 0 ? null : 'Codex failed; inspect protected worker logs',
        outputTruncated: bytes > 10_000_000 });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(prompt);
  });
}
