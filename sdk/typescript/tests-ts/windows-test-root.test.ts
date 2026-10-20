import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test.skipIf(process.platform !== "win32")(
  "prepares the Windows test root when another whoami is first on PATH",
  async () => {
    const root = await mkdtemp(join(tmpdir(), "codex-security-test-root-"));
    try {
      const profile = join(root, "test profile");
      const output = join(root, "github-output.txt");
      await mkdir(profile);
      await writeFile(
        join(root, "whoami.cmd"),
        "@echo off\r\necho shadowed whoami\r\nexit /b 1\r\n",
      );
      const systemRoot = process.env["SystemRoot"]!;
      const result = spawnSync(
        join(
          systemRoot,
          "System32",
          "WindowsPowerShell",
          "v1.0",
          "powershell.exe",
        ),
        [
          "-NoProfile",
          "-NonInteractive",
          "-File",
          fileURLToPath(
            new URL(
              "../scripts/prepare-windows-test-root.ps1",
              import.meta.url,
            ),
          ),
        ],
        {
          encoding: "utf8",
          windowsHide: true,
          env: {
            ...process.env,
            PATH: `${root};${process.env["PATH"] ?? ""}`,
            USERPROFILE: profile,
            GITHUB_OUTPUT: output,
          },
        },
      );
      expect({ status: result.status, stderr: result.stderr }).toEqual({
        status: 0,
        stderr: "",
      });
      expect(
        (await readFile(output, "utf16le")).replace(/^\uFEFF/, "").trim(),
      ).toBe(`path=${join(profile, ".codex-security-ci-temp")}`);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
