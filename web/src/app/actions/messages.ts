"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { contactOwner, sendMessage } from "@/lib/messages";
import { runOrBack, str } from "./util";

export async function contactListingOwner(listingId: string, fd: FormData) {
  const back = `/anuncio/${listingId}?de=mensaje#mensaje`;
  const user = await requireUser(`/anuncio/${listingId}#mensaje`);
  const { conversationId } = await runOrBack(back, () => contactOwner(user.id, listingId, str(fd, "body")));
  redirect(`/mensajes/${conversationId}`);
}

export async function replyInConversation(conversationId: string, fd: FormData) {
  const back = `/mensajes/${conversationId}`;
  const user = await requireUser(back);
  await runOrBack(`${back}#escribir`, () => sendMessage(user.id, conversationId, str(fd, "body")));
  redirect(`${back}#escribir`);
}
