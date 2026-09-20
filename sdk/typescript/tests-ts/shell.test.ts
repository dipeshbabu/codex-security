import { execFileSync } from "node:child_process";
import { delimiter, resolve } from "node:path";
import { expect, test } from "bun:test";
import { bashCommand } from "./support/shell.js";

const testWindows = process.platform === "win32" ? test : test.skip;

testWindows(
  "finds Git Bash when Git's mingw64 bin directory leads PATH",
  () => {
    const execPath = execFileSync("git", ["--exec-path"], {
      encoding: "utf8",
    }).trim();
    const originalPath = process.env["PATH"];
    try {
      process.env["PATH"] = [resolve(execPath, "../../bin"), originalPath].join(
        delimiter,
      );
      const bash = bashCommand();
      expect(bash).toBe(resolve(execPath, "../../../bin/bash.exe"));
      const output = execFileSync(bash, ["-c", "uname -s"], {
        encoding: "utf8",
      });
      expect(output).toMatch(/^MINGW/u);
    } finally {
      if (originalPath === undefined) delete process.env["PATH"];
      else process.env["PATH"] = originalPath;
    }
  },
);
