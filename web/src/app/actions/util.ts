import "server-only";
import { redirect } from "next/navigation";

import { UserError } from "@/lib/errors";

export { UserError };

/** Ejecuta una acción; si falla con un error mostrable, vuelve a la página con el mensaje en ?error=. */
export async function runOrBack<T>(back: string, fn: () => Promise<T>): Promise<T> {
  let msg: string;
  try {
    return await fn();
  } catch (e) {
    if (!(e instanceof UserError)) throw e;
    msg = e.message;
  }
  const [pathAndQuery, hash] = back.split("#");
  const sep = pathAndQuery.includes("?") ? "&" : "?";
  redirect(`${pathAndQuery}${sep}error=${encodeURIComponent(msg)}${hash ? "#" + hash : ""}`);
}

export const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
};
