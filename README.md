<div align="center">

<img src="assets/clarity-banner.png" alt="CLARITY banner" width="520" />

> Stop reading walls of logs. Keep only the signal after every command.

[![npm](https://img.shields.io/npm/v/clarityterm?color=cb3837&logo=npm&logoColor=white)](#get-started-in-60-seconds)
[![node](https://img.shields.io/badge/Node.js-%3E%3D18.0-3C873A?logo=node.js&logoColor=white)](#requirements)
[![tests](https://img.shields.io/badge/tests-node--test-green)](#development)
[![license](https://img.shields.io/badge/license-MIT-blue)](#license)

</div>

CLΛRITY is a minimalist terminal wrapper that runs the real command, saves the transcript to `~/.clarity/logs`, and prints an actionable block with the outcome, warnings, blockers, and next steps. Think of it as “calm mode” for every tool you already use.

## TL;DR
- Run `clarity npm install`, `clarity git push`, or any other command. CLΛRITY captures stdout/stderr, stores them in a timestamped log, and prints a compact summary block.
- Profiles keep the tone right: `calm` is terse by default, while `devops` surfaces log paths, stderr hints, and remediation steps every time.
- Output modes keep you in control: surface-level signal (`calm`), quick previews (`--details`), or full/raw streams when you actually need the noise.
- Nothing is hidden—exit codes are preserved, logs are first-class, and there is always an escape hatch for the full transcript.

## Get started in 60 seconds

```bash
npm install -g clarityterm           # exposes the `clarity` binary

clarity npm install                 # run anything through the wrapper
clarity logs --limit 3 --open       # inspect the log you just generated
```

Already contributing to the repo?

```bash
git clone https://github.com/ruidosujeira/clarity
cd clarity
npm install
npm link                            # optional: exposes `clarity` globally while hacking
```

Without `npm link`, run local builds via `node ./bin/clarity <command>`.

## What do you get?

- **Semantic summaries** tailored to each ecosystem (npm, git, docker, bun, python, go, rust, and more).
- **Integrated logging** so every run is archived at `~/.clarity/logs/<timestamp>-<command>.log` with pager/editor shortcuts.
- **Profile awareness** to switch between calm daily usage and the assertive `devops` persona.
- **Zero lock-in** because CLΛRITY executes the real command underneath, preserves the exit code, and supports `--raw`/`--full` fallbacks.

### Sample block (calm mode)

```
Λ_ clarity npm install

✔ Install complete
→ audited 8 packages
→ 0 vulnerabilities found
→ 3 packages looking for funding
→ Muted output: 42 stdout lines / 0 stderr lines captured. Try --details for a quick preview.

Use --full for detailed logs.
```

## CLI at a glance

```bash
clarity <command> [args...] [--details] [--full] [--raw] [--profile <name>]
clarity logs [--limit N] [--latest] [--open|--pager|--editor]
```

| Flag | Works with | Purpose |
| --- | --- | --- |
| `--profile calm|devops` | any command | Switch summary persona (default: `calm`). |
| `--details` | any command | Adds a head/tail preview of stdout/stderr beneath the block. |
| `--full` | any command | Prints summary, then dumps captured stdout/stderr. |
| `--raw` | any command | Streams stdout/stderr live while still saving the log. |
| `--logs-dir <path>` | any command | Override where transcripts are stored. |
| `logs --limit N` | `clarity logs` | Show the latest N runs (default 10). |
| `logs --latest` | `clarity logs` | Shortcut for the newest log (implied when `--limit 1`). |
| `logs --pager[=<cmd>]` | `clarity logs` | Open logs directly inside your pager (`bat`, `less`, etc.). |
| `logs --editor[=<cmd>]` | `clarity logs` | Jump into VS Code, Vim, or whatever `$EDITOR` you prefer. |

## Output modes & profiles

| Mode | When to use | Behavior |
| --- | --- | --- |
| `calm` (default) | Daily driver | One block containing the outcome plus curated bullets. |
| `--details` | Need more context fast | Adds a short preview (head/tail) of stdout/stderr right below the block. |
| `--full` | Want the entire transcript | Runs the command, saves the log, then dumps stdout/stderr when it ends. |
| `--raw` | Follow long streams live | Mirrors stdout/stderr while still writing the log file for posterity. |

| Profile | Designed for | Adds |
| --- | --- | --- |
| `calm` | People who just need “did it work?” | Minimal voice, muted log reminder. |
| `devops` | On-call / CI / operations | Explicit log paths, stderr counts, required next steps on failure. |

Switch on demand with `--profile devops` or permanently via `CLARITY_PROFILE=devops`.

## Logs workflow

Every run creates a timestamped log. Manage them with:

```bash
clarity logs --limit 5              # list the latest runs
clarity logs --open --latest        # print the newest log inline
clarity logs --pager=bat --limit 1  # send directly to bat/less
clarity logs --editor=code          # open inside VS Code
```

The CLI looks for `$CLARITY_PAGER`, `$PAGER`, `$EDITOR`, `$VISUAL`, or falls back to `less`/`nano` automatically.

## Plugin coverage

| Ecosystem | Detects | Delivered insights |
| --- | --- | --- |
| npm / yarn / pnpm | installs, audits, dependency conflicts | Shows success state, deprecated counts, funding info, `npm audit fix` hints, blocked resolutions. |
| git | `status`, `commit`, `push`, `pull` | Highlights dirty working trees, rejected pushes, merge instructions. |
| docker | `build`, `compose`, `push` | Surfaces failing layers, resulting images, registry tips. |
| bun | `bun install`, `bun run` | Captures Bun-specific warnings and completion status. |
| python (pip / pytest) | installs and test runs | Counts packages/tests, exposes failing suites, pip network issues. |
| go | `go build`, `go test`, `go run` | Highlights compiled targets, failing packages, next steps. |
| rust (cargo) | `cargo build`, `cargo test`, `cargo clippy` | Maps failing crates, lint warnings, suggested commands. |
| generic fallback | anything else | Exit code aware summary plus log pointer and stderr counts. |

Want to add your stack? Implement `supports(ctx)` + `summarize(ctx)` inside `src/plugins/<name>.js` and register it in `src/core/plugins.js`.

## Configuration reference

| Variable | Default | Description |
| --- | --- | --- |
| `CLARITY_PROFILE` | `calm` | Global default profile. |
| `CLARITY_LOGS_DIR` | `~/.clarity/logs` | Override where transcripts are written. |
| `CLARITY_PAGER` | auto | Preferred pager for `clarity logs --pager`. |
| `CLARITY_EDITOR` | auto | Preferred editor for `clarity logs --editor`. |
| `CLARITY_SHELL` | user shell | Shell used to execute commands when necessary. |

## Recipes

1. **Keep CI noise low** – wrap your build step with `clarity --profile devops npm run test` to keep pipelines readable while still surfacing failures and log paths.
2. **Inspect flaky commands** – first run with `clarity <cmd> --details`; if the preview is not enough, press ↑ and append `--full` to dump everything without re-running the original command manually.
3. **Jump into logs quicker** – pair `clarity logs --limit 1 --editor=code` with an alias to instantly land in VS Code whenever a command fails.
4. **Share context** – send teammates the file path printed in the block (e.g. `~/.clarity/logs/2024-05-08-143055-npm-install.log`) instead of pasting huge transcripts.

## Troubleshooting & FAQ

- **The command never appears to finish.** Some CLIs wait for stdin; rerun with `--raw` so the wrapped process inherits your TTY directly.
- **I need real-time output but still want the summary.** Use `clarity <cmd> --raw`. You get the stream plus the same block when the command exits.
- **Where are logs stored inside containers/CI?** The path is printed inside every block. Override with `CLARITY_LOGS_DIR=/tmp/clarity` if your environment needs a writable volume.
- **Can I disable plugins?** Not yet. Until per-plugin toggles exist, rely on the generic fallback by running through uncommon commands (the plugin only activates when `supports(ctx)` returns true).
- **Is Windows supported?** CLΛRITY targets Unix-like shells today. WSL works out of the box; native Windows support is on the roadmap.

## Development

```bash
npm install        # install CLI dependencies
npm test           # run unit + e2e suites (tests/*.test.js)

# When regenerating the GIF (optional)
# npm install imagemagick or reuse the container's convert binary
```

The e2e harness relies on fake binaries in `tests/fixtures/bin/*` so that summaries stay deterministic.

## Contributing
- Open an issue describing the ecosystem or heuristic you want to support.
- Include real-world logs or transcripts so we can calibrate summaries.
- Run `npm test` before opening a PR.
- Update this README and `CHANGELOG.md` when you ship new behavior.

## Release notes

- Version `0.2.0` introduces the new compact block helper, refreshed npm heuristics, and documentation overhaul. Track future entries in [`CHANGELOG.md`](CHANGELOG.md).

## License

MIT © 2024. See [`LICENSE`](LICENSE) for the full text.

## Assets & resources
- `assets/demo-raw.txt` and `assets/demo-clarity.txt` feed the demo GIF.
- Regenerate it with ImageMagick: `convert ... caption:@assets/demo-raw.txt ...` (see the commands in this README).
- The final GIF lives at `assets/clarity-demo.gif`; replace it to refresh the screenshot.

## Roadmap snapshot
- [x] Publish the npm package (`clarityterm`).
- [x] Roll out the block helper across all commands.
- [ ] Add `terraform`, `kubectl`, and `ansible` plugins.
- [ ] Store log metadata to filter by status/profile.
- [ ] `clarity watch <cmd>` to follow long-running pipelines with incremental summaries.
