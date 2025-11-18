const { createBlock, bullets } = require('../utils/blocks');

function countDeprecated(text) {
  const matches = text.match(/deprecated/gi);
  return matches ? matches.length : 0;
}

function includes(text, fragment) {
  return text && text.toLowerCase().includes(fragment.toLowerCase());
}

function extractFunding(stdout) {
  if (!stdout) {
    return null;
  }
  const match = stdout.match(/(\d+)\s+packages?\s+are\s+looking\s+for\s+funding/i);
  if (!match) {
    return null;
  }
  const count = Number(match[1]);
  const noun = count === 1 ? 'package' : 'packages';
  return `${count} ${noun} looking for funding`;
}

function extractVulnerabilities(stdout) {
  if (!stdout) {
    return null;
  }
  const match = stdout.match(/found\s+([^\n.]*vulnerabilities?[^\n.]*)/i);
  if (!match) {
    return null;
  }
  return match[1].replace(/\.$/, '').trim();
}

function extractAudit(stdout) {
  if (!stdout) {
    return null;
  }
  const match = stdout.match(/audited[^\n.]*/i);
  if (!match) {
    return null;
  }
  return match[0].replace(/^and\s+/i, '').replace(/^,\s*/, '').trim();
}

function buildDeprecatedLine(deprecatedCount) {
  if (!deprecatedCount) {
    return null;
  }
  const noun = deprecatedCount === 1 ? 'deprecated package' : 'deprecated packages';
  return `${deprecatedCount} ${noun}`;
}

function buildInstallBlock(stdout, deprecatedCount) {
  const normalized = stdout || '';
  const audit = extractAudit(normalized);
  const vulnerabilities = extractVulnerabilities(normalized);
  const funding = extractFunding(normalized);
  const deprecatedLine = buildDeprecatedLine(deprecatedCount);

  const items = bullets([
    audit,
    vulnerabilities,
    funding,
    deprecatedLine
  ]);

  const headline = /up to date/i.test(normalized) ? '✔ Already up to date' : '✔ Install complete';
  return createBlock({ headline, items });
}

module.exports = {
  supports(ctx) {
    return ctx.command === 'npm';
  },
  summarize(ctx) {
    const warnings = [];
    const nextSteps = [];
    let error;
    let result;
    let block;

    const stdout = ctx.stdout || '';
    const stderr = ctx.stderr || '';

    if (ctx.exitCode === 0 && (/added/i.test(stdout) || /up to date/i.test(stdout))) {
      const deprecatedCount = countDeprecated(stdout);
      block = buildInstallBlock(stdout, deprecatedCount);
      if (!block) {
        result = 'Dependencies installed or updated successfully.';
        if (deprecatedCount > 0) {
          warnings.push(`${deprecatedCount} packages are deprecated but still functional.`);
        }
      }
    } else {
      const deprecatedCount = countDeprecated(stdout);
      if (deprecatedCount > 0) {
        warnings.push(`${deprecatedCount} packages are deprecated but still functional.`);
      }
    }

    if (includes(stderr, 'ERR! code ERESOLVE')) {
      error = 'Dependency conflict while installing packages (ERESOLVE).';
      nextSteps.push('Adjust dependency versions in package.json to resolve the conflict.');
    } else if (includes(stderr, 'ERR! network')) {
      error = 'Network failure while downloading packages.';
      nextSteps.push('Check your internet connection and try again.');
    } else if (ctx.exitCode !== 0 && !error) {
      error = 'npm command failed.';
      nextSteps.push('Run again with --full to review the full log.');
    }

    return {
      block,
      result,
      warnings: warnings.length ? warnings : undefined,
      error,
      nextSteps: nextSteps.length ? nextSteps : undefined
    };
  }
};
