# CLI Reference

Complete reference for the `opencode-codex-orch` command-line interface.

## Basic Usage

```bash
# Display help
bunx opencode-codex-orch

# Or with npx
npx opencode-codex-orch
```

## Commands

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `install`           | Interactive setup wizard                  |
| `doctor`            | Environment diagnostics and health checks |
| `run`               | OpenCode session runner                   |
| `validate-skill`    | Validate a local SKILL.md and eval suite  |
| `eval-skill`        | Run explicit-invocation skill eval cases  |
| `grade-skill-eval`  | Grade a saved skill eval report           |
| `mcp oauth`         | MCP OAuth authentication management       |
| `auth`              | Google Antigravity OAuth authentication   |
| `get-local-version` | Display local version information         |

---

## install

Interactive installation tool for initial `opencode-codex-orch` setup. Provides a TUI based on `@clack/prompts`.

### Usage

```bash
bunx opencode-codex-orch install
```

### Installation Process

1. **Provider Selection**: Choose your AI provider (Claude, ChatGPT, or Gemini)
2. **API Key Input**: Enter the API key for your selected provider
3. **Configuration File Creation**: Generates `opencode.json` or `opencode-codex-orch.json` files
4. **Plugin Registration**: Automatically registers the opencode-codex-orch plugin in OpenCode settings

### Options

| Option      | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| `--no-tui`  | Run in non-interactive mode without TUI (for CI/CD environments) |
| `--verbose` | Display detailed logs                                            |

---

## doctor

Diagnoses your environment to ensure `opencode-codex-orch` is functioning correctly. Performs 17+ health checks.

### Usage

```bash
bunx opencode-codex-orch doctor
```

### Diagnostic Categories

| Category           | Check Items                                               |
| ------------------ | --------------------------------------------------------- |
| **Installation**   | OpenCode version (>= 1.0.150), plugin registration status |
| **Configuration**  | Configuration file validity, JSON parsing                 |
| **Authentication** | Anthropic, OpenAI, Google API key validity                |
| **Dependencies**   | Bun, Node.js, Git installation status                     |
| **Tools**          | LSP server status, MCP server status                      |
| **Updates**        | Latest version check                                      |

### Options

| Option              | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `--category <name>` | Check specific category only (e.g., `--category authentication`) |
| `--json`            | Output results in JSON format                                    |
| `--verbose`         | Include detailed information                                     |

### Example Output

```
opencode-codex-orch doctor

┌──────────────────────────────────────────────────┐
│  opencode-codex-orch Doctor                      │
└──────────────────────────────────────────────────┘

Installation
  ✓ OpenCode version: 1.0.155 (>= 1.0.150)
  ✓ Plugin registered in opencode.json

Configuration
  ✓ opencode-codex-orch.json is valid
  ⚠ categories.designer: using default model

Authentication
  ✓ Anthropic API key configured
  ✓ OpenAI API key configured
  ✗ Google API key not found

Dependencies
  ✓ Bun 1.2.5 installed
  ✓ Node.js 22.0.0 installed
  ✓ Git 2.45.0 installed

Summary: 10 passed, 1 warning, 1 failed
```

---

## run

Executes OpenCode sessions and monitors task completion.

### Usage

```bash
bunx opencode-codex-orch run [prompt]
```

### Options

| Option                   | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `--enforce-completion`   | Keep session active until all TODOs are completed |
| `--agent <name>`         | Specify agent to use                              |
| `--directory <path>`     | Set working directory                             |
| `--port <number>`        | Set port for session                              |
| `--attach`               | Attach to existing session                        |
| `--json`                 | Output in JSON format                             |
| `--no-timestamp`         | Disable timestamped output                        |
| `--session-id <id>`      | Resume existing session                           |
| `--timeout <seconds>`    | Abort the run after the given number of seconds   |
| `--on-complete <action>` | Action on completion                              |
| `--verbose`              | Enable verbose logging                            |

---

## validate-skill

Validates a local `SKILL.md` and optionally checks an eval suite plus referenced fixture files.

### Usage

```bash
bunx opencode-codex-orch validate-skill .opencode/skills/my-skill
bunx opencode-codex-orch validate-skill .opencode/skills/my-skill --eval-file ./docs/examples/skill-creator/evals.json --json
```

---

## eval-skill

Runs a skill through explicit `skill(name="...")` invocation against an eval suite and emits a raw report.

### Usage

```bash
bunx opencode-codex-orch eval-skill .opencode/skills/my-skill --eval-file ./docs/examples/skill-creator/evals.yaml
bunx opencode-codex-orch eval-skill .opencode/skills/my-skill --eval-file ./docs/examples/skill-creator/evals.json --timeout 90 --output ./skill-eval-report.json
```

### Example Suite Assets

- `docs/examples/skill-creator/evals.json`
- `docs/examples/skill-creator/evals.yaml`
- `docs/examples/skill-creator/fixtures/basic-skill/SKILL.md`

For the full eval suite format and workflow, see the [Skill Creator Eval Guide](../guide/skill-creator-evals.md).

---

## grade-skill-eval

Re-grades a saved raw eval report without rerunning the skill.

### Usage

```bash
bunx opencode-codex-orch grade-skill-eval ./skill-eval-report.json
```

---

## mcp oauth

Manages OAuth 2.1 authentication for remote MCP servers.

### Usage

```bash
# Login to an OAuth-protected MCP server
bunx opencode-codex-orch mcp oauth login <server-name> --server-url https://api.example.com

# Login with explicit client ID and scopes
bunx opencode-codex-orch mcp oauth login my-api --server-url https://api.example.com --client-id my-client --scopes "read,write"

# Remove stored OAuth tokens
bunx opencode-codex-orch mcp oauth logout <server-name>

# Check OAuth token status
bunx opencode-codex-orch mcp oauth status [server-name]
```

### Options

| Option               | Description                                                               |
| -------------------- | ------------------------------------------------------------------------- |
| `--server-url <url>` | MCP server URL (required for login)                                       |
| `--client-id <id>`   | OAuth client ID (optional if server supports Dynamic Client Registration) |
| `--scopes <scopes>`  | Comma-separated OAuth scopes                                              |

### Token Storage

Tokens are stored in `~/.config/opencode/mcp-oauth.json` with `0600` permissions (owner read/write only). Key format: `{serverHost}/{resource}`.

---

## Configuration Files

The CLI searches for configuration files in the following locations (in priority order):

1. **Project Level**: `.opencode/opencode-codex-orch.json`
2. **User Level**: `~/.config/opencode/opencode-codex-orch.json`

### Plugin Config Format

Plugin config files use strict JSON. Comments and trailing commas are rejected. OpenCode core config still supports `opencode.jsonc`.

```json
{
  "orchestrator_agent": {
    "disabled": false,
    "planner_enabled": true
  },
  "categories": {
    "designer": {
      "model": "google/gemini-3.1-pro"
    }
  }
}
```

> **Note**: The canonical config key is `orchestrator_agent`. Legacy `sisyphus_agent` is still migrated for compatibility.

---

## Troubleshooting

### "OpenCode version too old" Error

```bash
# Update OpenCode
npm install -g opencode@latest
# or
bun install -g opencode@latest
```

### "Plugin not registered" Error

```bash
# Reinstall plugin
bunx opencode-codex-orch install
```

### Doctor Check Failures

```bash
# Diagnose with detailed information
bunx opencode-codex-orch doctor --verbose

# Check specific category only
bunx opencode-codex-orch doctor --category authentication
```

---

## Non-Interactive Mode

Use the `--no-tui` option for CI/CD environments.

```bash
# Run doctor in CI environment
bunx opencode-codex-orch doctor --no-tui --json

# Save results to file
bunx opencode-codex-orch doctor --json > doctor-report.json
```

---

## Developer Information

### CLI Structure

```
src/cli/
├── cli-program.ts        # Commander.js-based main entry
├── install.ts            # @clack/prompts-based TUI installer
├── config-manager/       # Config parsing, multi-source config management
│   └── *.ts
├── doctor/               # Health check system
│   ├── index.ts          # Doctor command entry
│   └── checks/           # 17+ individual check modules
├── run/                  # Session runner
│   └── *.ts
└── mcp-oauth/            # OAuth management commands
    └── *.ts
```

### Adding New Doctor Checks

Create `src/cli/doctor/checks/my-check.ts`:

```typescript
import type { DoctorCheck } from "../types";

export const myCheck: DoctorCheck = {
  name: "my-check",
  category: "environment",
  check: async () => {
    // Check logic
    const isOk = await someValidation();

    return {
      status: isOk ? "pass" : "fail",
      message: isOk ? "Everything looks good" : "Something is wrong",
    };
  },
};
```

Register in `src/cli/doctor/checks/index.ts`:

```typescript
export { myCheck } from "./my-check";
```
