"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseDay } from "@/lib/format";
import { actOnBooking, createBooking, leaveReview, sendMessage } from "@/lib/bookings";
import type { Action } from "@/lib/booking-rules";
import { runOrBack, str, UserError } from "./util";

const ACTIONS: Action[] = ["accept", "decline", "cancel", "pickup", "return_ok", "incident"];

export async function requestBooking(listingId: string, fd: FormData) {
  const back = `/anuncio/${listingId}`;
  const user = await requireUser(back);
  const id = await runOrBack(back, async () => {
    const start = parseDay(str(fd, "start"));
    const end = parseDay(str(fd, "end"));
    if (!start || !end) throw new UserError("Elige las fechas de recogida y devolución");
    const b = await createBooking(user.id, { listingId, start, end, insurance: fd.get("insurance") === "on" });
    return b.id;
  });
  redirect(`/reservas/${id}`);
}

export async function bookingAction(bookingId: string, fd: FormData) {
  const back = `/reservas/${bookingId}`;
  const user = await requireUser(back);
  await runOrBack(back, async () => {
    const action = str(fd, "action") as Action;
    if (!ACTIONS.includes(action)) throw new UserError("Acción no válida");
    if (action === "return_ok" && fd.get("confirm") !== "on")
      throw new UserError("Para finalizar, confirma que el objeto se ha devuelto en buen estado");
    await actOnBooking(user.id, bookingId, action, Number(str(fd, "version")), str(fd, "incidentText"));
  });
  revalidatePath(back);
  redirect(back);
}

export async function reviewBooking(bookingId: string, fd: FormData) {
  const back = `/reservas/${bookingId}`;
  const user = await requireUser(back);
  await runOrBack(back, () => leaveReview(user.id, bookingId, Number(str(fd, "rating")), str(fd, "text")));
  redirect(back);
}

export async function postMessage(bookingId: string, fd: FormData) {
  const back = `/reservas/${bookingId}`;
  const user = await requireUser(back);
  await runOrBack(back, () => sendMessage(user.id, bookingId, str(fd, "body")));
  redirect(`${back}#chat`);
}
