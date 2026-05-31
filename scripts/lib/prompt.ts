import process from "node:process";
import readline from "node:readline";

const C = {
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
};

export type Choice<T> = { label: string; value: T; hint?: string };

/**
 * Interactive single-select radio list — arrow keys (or j/k) to move,
 * Enter to confirm, Ctrl-C to abort. Falls back to the initial choice
 * when stdin is not a TTY (e.g. piped / CI), so scripts stay scriptable.
 */
export const radioSelect = <T>(
  message: string,
  choices: Choice<T>[],
  initialIndex = 0,
): Promise<T> => {
  if (!process.stdin.isTTY) {
    return Promise.resolve(choices[initialIndex].value);
  }

  return new Promise<T>((resolve) => {
    const { stdin, stdout } = process;
    let index = initialIndex;
    let rendered = 0;

    readline.emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();

    const draw = (done = false) => {
      if (rendered > 0) stdout.write(`\x1b[${rendered}A`);

      const lines = [`? ${message}`];
      if (done) {
        lines.push(`  ${C.green("✔")} ${choices[index].label}`);
      } else {
        for (const [i, c] of choices.entries()) {
          const active = i === index;
          const marker = active ? C.cyan("◉") : "◯";
          const label = active ? C.cyan(c.label) : c.label;
          const hint = c.hint ? ` ${C.dim(c.hint)}` : "";
          lines.push(`${active ? C.cyan("›") : " "} ${marker} ${label}${hint}`);
        }
      }

      stdout.write(lines.map((l) => `\x1b[2K${l}`).join("\n") + "\n");
      rendered = done ? 0 : lines.length;
    };

    const finish = (cb: () => void) => {
      stdin.removeListener("keypress", onKey);
      stdin.setRawMode(false);
      stdin.pause();
      cb();
    };

    const onKey = (_s: string, key: readline.Key) => {
      if (!key) return;
      if (key.name === "up" || key.name === "k") {
        index = (index - 1 + choices.length) % choices.length;
        draw();
      } else if (key.name === "down" || key.name === "j") {
        index = (index + 1) % choices.length;
        draw();
      } else if (key.name === "return") {
        draw(true);
        finish(() => resolve(choices[index].value));
      } else if (key.ctrl && key.name === "c") {
        finish(() => {
          stdout.write("\n");
          process.exit(130);
        });
      }
    };

    stdin.on("keypress", onKey);
    draw();
  });
};

/** Single-line free-text prompt with an optional default. */
export const textInput = (
  message: string,
  opts: { default?: string } = {},
): Promise<string> => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const suffix = opts.default ? ` ${C.dim(`(${opts.default})`)}` : "";
  return new Promise((resolve) => {
    rl.question(`? ${message}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || opts.default || "");
    });
  });
};
