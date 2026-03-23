import { existsSync } from "node:fs"

const DEFAULT_ZSH_PATHS = ["/bin/zsh", "/usr/bin/zsh", "/usr/local/bin/zsh"]
const DEFAULT_BASH_PATHS = ["/bin/bash", "/usr/bin/bash", "/usr/local/bin/bash"]

const WRAPPING_QUOTES_PATTERN = /^["'`‘’“”]+|["'`‘’“”]+$/g

export function sanitizeShellPath(shellPath?: string): string | undefined {
	if (!shellPath) {
		return undefined
	}

	const normalizedPath = shellPath.trim().replace(WRAPPING_QUOTES_PATTERN, "")
	return normalizedPath || undefined
}

function findShellPath(
	defaultPaths: string[],
	customPath?: string,
): string | null {
	const normalizedCustomPath = sanitizeShellPath(customPath)

	if (normalizedCustomPath && existsSync(normalizedCustomPath)) {
		return normalizedCustomPath
	}
	for (const path of defaultPaths) {
		if (existsSync(path)) {
			return path
		}
	}
	return null
}

export function findZshPath(customZshPath?: string): string | null {
	return findShellPath(DEFAULT_ZSH_PATHS, customZshPath)
}

export function findBashPath(): string | null {
	return findShellPath(DEFAULT_BASH_PATHS)
}
