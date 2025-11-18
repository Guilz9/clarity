const { spawn } = require('child_process');
const { writeLog } = require('../utils/logs');
const { createBlock, bullets, normalizeItem } = require('../utils/blocks');
const { getSummary } = require('./plugins');
const { applyProfile } = require('./profiles');

function execute(command, args, { raw }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: process.env,
      shell: false
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (raw) {
        process.stdout.write(text);
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (raw) {
        process.stderr.write(text);
      }
    });

    child.on('error', (error) => {
      const message = error.code === 'ENOENT'
        ? `Command not found: ${command}`
        : error.message;
      resolve({ stdout, stderr: `${stderr}${message}\n`, exitCode: 127 });
    });

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
}

function printFull({ stdout, stderr }) {
  if (stdout) {
    process.stdout.write(stdout);
  }
  if (stderr) {
    process.stderr.write(stderr);
  }
}

function printSummary(summary, { profile = 'calm' } = {}) {
  const meta = { blockPrinted: false };
  if (!summary) {
    return meta;
  }

  if (summary.block) {
    console.log(summary.block);
    meta.blockPrinted = true;
  }

  const showExtras = profile !== 'calm' || !summary.block;

  if (showExtras) {
    if (summary.result) {
      console.log(`✔ Result: ${summary.result}`);
    }
    if (summary.warnings && summary.warnings.length) {
      console.log('⚠ Warnings:');
      summary.warnings.forEach((warn) => console.log(`- ${warn}`));
    }
    if (summary.error) {
      console.log(`❌ Error: ${summary.error}`);
    }
    if (summary.nextSteps && summary.nextSteps.length) {
      console.log('→ Next steps:');
      summary.nextSteps.forEach((step) => console.log(`- ${step}`));
    }
  }

  return meta;
}

function lineCount(output) {
  if (!output) {
    return 0;
  }
  const normalized = output.replace(/\r\n/g, '\n').replace(/\n+$/g, '');
  if (!normalized) {
    return 0;
  }
  return normalized.split('\n').length;
}

function splitLines(output) {
  if (!output) {
    return [];
  }
  const normalized = output.replace(/\r\n/g, '\n').replace(/\n+$/g, '');
  if (!normalized) {
    return [];
  }
  return normalized.split('\n');
}

function pluralize(label, value) {
  return `${value} ${label}${value === 1 ? '' : 's'}`;
}

function formatPreview(lines, limit = 6) {
  if (lines.length <= limit * 2) {
    return lines.join('\n');
  }
  return [...lines.slice(0, limit), '...', ...lines.slice(-limit)].join('\n');
}

function printDetailsPreview({ stdout, stderr }, limit = 6) {
  const stdoutLines = splitLines(stdout);
  const stderrLines = splitLines(stderr);

  if (!stdoutLines.length && !stderrLines.length) {
    console.log('\nNo additional output was captured to preview.');
    console.log('Use --full to inspect every line or --raw to stream it live next time.');
    return;
  }

  console.log('\nCaptured output preview (truncated):');

  if (stdoutLines.length) {
    console.log('\n--- stdout ---');
    console.log(formatPreview(stdoutLines, limit));
  }

  if (stderrLines.length) {
    console.log('\n--- stderr ---');
    console.log(formatPreview(stderrLines, limit));
  }

  console.log('\nUse --full for the entire log or --raw to stream the next run live.');
}

function extractFlags(args = []) {
  return args.filter((arg) => arg.startsWith('-'));
}

async function runClarity({ command, args, options = {} }) {
  const mode = options.raw
    ? 'raw'
    : options.full
      ? 'full'
      : options.details
        ? 'details'
        : 'calm';
  const profile = options.profile || 'calm';

  const { stdout, stderr, exitCode } = await execute(command, args, { raw: mode === 'raw' });

  const logPath = writeLog({ command, args, stdout, stderr, exitCode });

  if (mode === 'raw') {
    return exitCode;
  }

  if (mode === 'full') {
    printFull({ stdout, stderr });
    return exitCode;
  }

  const context = {
    command,
    args,
    stdout,
    stderr,
    exitCode,
    profile,
    logPath
  };

  const summary = getSummary(context);
  const profiledSummary = applyProfile(context, summary);
  const formattedSummary = ensureBlock(profiledSummary, context);

  printSummary(formattedSummary, { profile });
  if (mode === 'details') {
    printDetailsPreview({ stdout, stderr });
  }
  return exitCode;
}

function ensureBlock(summary, ctx) {
  if (!summary) {
    return summary;
  }

  if (summary.block) {
    return summary;
  }

  const items = [];
  if (summary.warnings && summary.warnings.length) {
    items.push(...bullets(summary.warnings, '•'));
  }
  if (summary.nextSteps && summary.nextSteps.length) {
    items.push(...bullets(summary.nextSteps, '→'));
  }
  const mutedLine = buildMutedLine(ctx);
  if (mutedLine) {
    items.push(normalizeItem(mutedLine, '→'));
  }

  const fallbackHeadline = ctx.exitCode === 0
    ? '✔ Command completed successfully'
    : '❌ Command failed';

  const headline = summary.error
    ? `❌ ${summary.error}`
    : summary.result
      ? `✔ ${summary.result}`
      : fallbackHeadline;

  const footer = ctx.exitCode === 0
    ? 'Use --full for detailed logs.'
    : 'Use --full to inspect the full log.';

  summary.block = createBlock({ headline, items, footer });
  return summary;
}

function buildMutedLine({ stdout, stderr, args }) {
  const stdoutLines = lineCount(stdout);
  const stderrLines = lineCount(stderr);
  if (!stdoutLines && !stderrLines) {
    return null;
  }

  const parts = [
    `Muted output: ${pluralize('stdout line', stdoutLines)} / ${pluralize('stderr line', stderrLines)} captured.`
  ];

  const flags = extractFlags(args);
  if (flags.length) {
    parts.push(`Flags: ${flags.join(' ')}`);
  }

  parts.push('Try --details for a quick preview.');
  return parts.join(' ');
}

module.exports = runClarity;
