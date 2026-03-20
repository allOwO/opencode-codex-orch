export function getPlatformPackage({ platform, arch, libcFamily }) {
  let suffix = "";
  if (platform === "linux") {
    if (libcFamily === null || libcFamily === undefined) {
      throw new Error(
        "Could not detect libc on Linux. " +
        "Please ensure detect-libc is installed or report this issue."
      );
    }
    if (libcFamily === "musl") {
      suffix = "-musl";
    }
  }
  
  const os = platform === "win32" ? "windows" : platform;
  return `opencode-codex-orch-${os}-${arch}${suffix}`;
}

export function getPlatformPackageCandidates({ platform, arch, libcFamily, preferBaseline = false }) {
  const primaryPackage = getPlatformPackage({ platform, arch, libcFamily });
  const baselinePackage = getBaselinePlatformPackage({ platform, arch, libcFamily });

  if (!baselinePackage) {
    return [primaryPackage];
  }

  return preferBaseline ? [baselinePackage, primaryPackage] : [primaryPackage, baselinePackage];
}

function getBaselinePlatformPackage({ platform, arch, libcFamily }) {
  if (arch !== "x64") {
    return null;
  }

  if (platform === "darwin") {
    return "opencode-codex-orch-darwin-x64-baseline";
  }

  if (platform === "win32") {
    return "opencode-codex-orch-windows-x64-baseline";
  }

  if (platform === "linux") {
    if (libcFamily === null || libcFamily === undefined) {
      throw new Error(
        "Could not detect libc on Linux. " +
        "Please ensure detect-libc is installed or report this issue."
      );
    }

    if (libcFamily === "musl") {
      return "opencode-codex-orch-linux-x64-musl-baseline";
    }

    return "opencode-codex-orch-linux-x64-baseline";
  }

  return null;
}

export function getBinaryPath(pkg, platform) {
  const ext = platform === "win32" ? ".exe" : "";
  return `${pkg}/bin/opencode-codex-orch${ext}`;
}
