import { describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { getMergedServers, loadJsonFile } from "./server-config-loader";

describe("loadJsonFile", () => {
	it("parses strict JSON plugin config files", () => {
		// given
		const testData = {
			lsp: {
				typescript: {
					command: ["tsserver"],
					extensions: [".ts", ".tsx"],
				},
			},
		};
		const jsonContent = `{
  "lsp": {
    "typescript": {
      "command": ["tsserver"],
      "extensions": [".ts", ".tsx"]
    }
  }
}`;
		const tempPath = join(tmpdir(), "test-config.json");
		writeFileSync(tempPath, jsonContent, "utf-8");

		// when
		const result = loadJsonFile<typeof testData>(tempPath);

		// then
		expect(result).toEqual(testData);

		// cleanup
		unlinkSync(tempPath);
	});

	it("rejects JSONC plugin config files with comments", () => {
		const tempPath = join(tmpdir(), `test-config-invalid-${Date.now()}.json`);
		writeFileSync(tempPath, '{\n  // invalid json\n  "lsp": {}\n}\n', "utf-8");

		expect(loadJsonFile<Record<string, unknown>>(tempPath)).toBeNull();

		unlinkSync(tempPath);
	});

	it("ignores JSONC-only user config (opencode-codex-orch.jsonc)", () => {
		const originalEnv = process.env.OPENCODE_CONFIG_DIR;
		const tempBase = join(
			tmpdir(),
			`oco-test-user-jsonc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		try {
			mkdirSync(tempBase, { recursive: true });
			process.env.OPENCODE_CONFIG_DIR = tempBase;

			const userJsonc = `{
  // user jsonc config
  "lsp": {
    "user-jsonc": {
      "command": ["user-jsonc-cmd"],
      "extensions": [".ujs"]
    }
  }
}`;
			const userPath = join(tempBase, "opencode-codex-orch.jsonc");
			writeFileSync(userPath, userJsonc, "utf-8");

			const servers = getMergedServers();
			const found = servers.find(
				(s) => s.id === "user-jsonc" && s.source === "user",
			);
			expect(found).toBeUndefined();
		} finally {
			if (originalEnv === undefined) delete process.env.OPENCODE_CONFIG_DIR;
			else process.env.OPENCODE_CONFIG_DIR = originalEnv;
			rmSync(tempBase, { recursive: true, force: true });
		}
	});

	it("discovers JSONC-only opencode config (opencode.jsonc)", () => {
		const originalEnv = process.env.OPENCODE_CONFIG_DIR;
		const tempBase = join(
			tmpdir(),
			`oco-test-oc-jsonc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		try {
			mkdirSync(tempBase, { recursive: true });
			process.env.OPENCODE_CONFIG_DIR = tempBase;

			const opencodeJsonc = `{
  // opencode jsonc config
  "lsp": {
    "opencode-jsonc": {
      "command": ["opencode-jsonc-cmd"],
      "extensions": [".ocjs"]
    }
  }
}`;
			const opencodePath = join(tempBase, "opencode.jsonc");
			writeFileSync(opencodePath, opencodeJsonc, "utf-8");

			const servers = getMergedServers();
			const found = servers.find(
				(s) => s.id === "opencode-jsonc" && s.source === "opencode",
			);
			expect(found !== undefined).toBe(true);
		} finally {
			if (originalEnv === undefined) delete process.env.OPENCODE_CONFIG_DIR;
			else process.env.OPENCODE_CONFIG_DIR = originalEnv;
			rmSync(tempBase, { recursive: true, force: true });
		}
	});

	it("ignores JSONC-only project config (.opencode/opencode-codex-orch.jsonc)", () => {
		const originalCwd = process.cwd();
		const tempProject = join(
			tmpdir(),
			`oco-test-project-jsonc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		try {
			mkdirSync(join(tempProject, ".opencode"), { recursive: true });
			const projectJsonc = `{
  // project jsonc config
  "lsp": {
    "project-jsonc": {
      "command": ["project-jsonc-cmd"],
      "extensions": [".pjs"]
    }
  }
}`;
			const projectPath = join(
				tempProject,
				".opencode",
				"opencode-codex-orch.jsonc",
			);
			writeFileSync(projectPath, projectJsonc, "utf-8");

			process.chdir(tempProject);
			const servers = getMergedServers();
			const found = servers.find(
				(s) => s.id === "project-jsonc" && s.source === "project",
			);
			expect(found).toBeUndefined();
		} finally {
			process.chdir(originalCwd);
			rmSync(tempProject, { recursive: true, force: true });
		}
	});

	it("prefers plugin .json over ignored .jsonc when both exist", () => {
		const originalEnv = process.env.OPENCODE_CONFIG_DIR;
		const tempBase = join(
			tmpdir(),
			`oco-test-precedence-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		try {
			mkdirSync(tempBase, { recursive: true });
			process.env.OPENCODE_CONFIG_DIR = tempBase;

			const jsonContent = `{
  "lsp": {
    "conflict": {
      "command": ["from-json"],
      "extensions": [".j"]
    }
  }
}`;
			const jsoncContent = `{
  // jsonc should take precedence
  "lsp": {
    "conflict": {
      "command": ["from-jsonc"],
      "extensions": [".jc"]
    }
  }
}`;
			writeFileSync(
				join(tempBase, "opencode-codex-orch.json"),
				jsonContent,
				"utf-8",
			);
			writeFileSync(
				join(tempBase, "opencode-codex-orch.jsonc"),
				jsoncContent,
				"utf-8",
			);

			const servers = getMergedServers();
			const found = servers.find(
				(s) => s.id === "conflict" && s.source === "user",
			);
			expect(
				found?.command &&
					Array.isArray(found.command) &&
					found.command[0] === "from-json",
			).toBe(true);
		} finally {
			if (originalEnv === undefined) delete process.env.OPENCODE_CONFIG_DIR;
			else process.env.OPENCODE_CONFIG_DIR = originalEnv;
			rmSync(tempBase, { recursive: true, force: true });
		}
	});
});
