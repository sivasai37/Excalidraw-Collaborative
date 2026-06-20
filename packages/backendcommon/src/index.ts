import fs from "fs";
import path from "path";

function loadEnv() {
  // Try to find .env starting from current working directory and traversing up
  let currentDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const envPath = path.join(currentDir, ".env");
    if (fs.existsSync(envPath)) {
      try {
        const envConfig = fs.readFileSync(envPath, "utf-8");
        envConfig.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const firstEqual = trimmed.indexOf("=");
            if (firstEqual !== -1) {
              const key = trimmed.substring(0, firstEqual).trim();
              let val = trimmed.substring(firstEqual + 1).trim();
              if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
              } else if (val.startsWith("'") && val.endsWith("'")) {
                val = val.substring(1, val.length - 1);
              }
              if (key && !process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        });
        return;
      } catch (e) {
        // Ignore errors
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  // Fallback to check relative paths from __dirname
  const relativePaths = [
    path.resolve(__dirname, "../../../.env"),
    path.resolve(__dirname, "../../../../.env"),
  ];
  for (const envPath of relativePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const envConfig = fs.readFileSync(envPath, "utf-8");
        envConfig.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const firstEqual = trimmed.indexOf("=");
            if (firstEqual !== -1) {
              const key = trimmed.substring(0, firstEqual).trim();
              let val = trimmed.substring(firstEqual + 1).trim();
              if (val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1);
              } else if (val.startsWith("'") && val.endsWith("'")) {
                val = val.substring(1, val.length - 1);
              }
              if (key && !process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        });
        return;
      } catch (e) {
        // Ignore
      }
    }
  }
}

loadEnv();

// Ensure JWT_SECRET is configured in production
if (
  process.env.NODE_ENV === "production" &&
  !process.env.JWT_SECRET
) {
  throw new Error(
    "JWT_SECRET must be set in production"
  );
}

export const JWT_SECRET =
  process.env.JWT_SECRET || "dev-secret";