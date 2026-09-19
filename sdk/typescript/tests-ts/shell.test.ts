import { execFileSync } from "node:child_process";
import { isAbsolute, join, resolve } from "node:path";
import { expect, spyOn, test } from "bun:test";
import { bashCommand, runCommand } from "./support/shell.js";

test.skipIf(process.platform !== "win32").each(["cmd", "mingw64/bin"])(
  "uses Git Bash when Git is found in %s",
  async (directory) => {
    const gitExecPath = execFileSync("git", ["--exec-path"], {
      encoding: "utf8",
      timeout: 10_000,
      windowsHide: true,
    }).trim();
    const gitRoot = resolve(gitExecPath, "..", "..", "..");
    const which = spyOn(Bun, "which").mockReturnValue(
      join(gitRoot, directory, "git.exe"),
    );
    let bash: string;
    try {
      bash = bashCommand();
    } finally {
      which.mockRestore();
    }

    expect(isAbsolute(bash)).toBe(true);
    const result = await runCommand(bash, ["-c", "uname -s"], {
      timeout: 10_000,
    });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(/^MINGW/u);
  },
);
