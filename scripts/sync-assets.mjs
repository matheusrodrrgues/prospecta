import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const source = path.join(process.cwd(), "prospecta", "assets");
const target = path.join(process.cwd(), "public", "legacy");

if (existsSync(source)) {
  await mkdir(path.dirname(target), { recursive: true });
  await rm(target, { recursive: true, force: true });
  await cp(source, target, { recursive: true });
  console.log("Prototype assets synchronized to public/legacy.");
}
