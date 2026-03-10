import { execFile } from "child_process";
import { ok, handleError } from "@/lib/api";

export async function POST() {
  try {
    const folderPath = await openNativeFolderPicker();
    if (!folderPath) {
      return ok({ cancelled: true }, 200);
    }
    return ok({ path: folderPath }, 200);
  } catch (err) {
    return handleError(err);
  }
}

function openNativeFolderPicker(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const platform = process.platform;

    if (platform === "darwin") {
      execFile(
        "osascript",
        [
          "-e",
          'POSIX path of (choose folder with prompt "Select sprint-forge project directory")',
        ],
        (error, stdout) => {
          if (error) {
            // User cancelled the dialog
            if (error.code === 1) return resolve(null);
            return reject(error);
          }
          resolve(stdout.trim().replace(/\/$/, ""));
        }
      );
    } else if (platform === "linux") {
      execFile(
        "zenity",
        ["--file-selection", "--directory", "--title=Select sprint-forge project directory"],
        (error, stdout) => {
          if (error) {
            if (error.code === 1) return resolve(null);
            return reject(error);
          }
          resolve(stdout.trim());
        }
      );
    } else {
      // Windows or unsupported — fallback: user types path manually
      resolve(null);
    }
  });
}
