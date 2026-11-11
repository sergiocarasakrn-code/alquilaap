// Máquina de estados de una reserva. Lógica pura (sin base de datos) para poder probarla a fondo.
//
// requested --accept--> accepted --(ambos «alquilado»)--> in_progress --(ambos «finalizado»)--> completed
// requested --decline--> declined        requested|accepted --cancel--> cancelled
// accepted|in_progress --incident--> incident (se congela y lo revisa soporte)

export type Status = "requested" | "accepted" | "in_progress" | "completed" | "incident" | "declined" | "cancelled" | "expired";
export type Action = "accept" | "decline" | "cancel" | "pickup" | "return_ok" | "incident";
export type Role = "owner" | "renter";

export interface BookingState {
  status: Status;
  ownerPickedUpAt: Date | null;
  renterPickedUpAt: Date | null;
  ownerReturnedOkAt: Date | null;
  renterReturnedOkAt: Date | null;
}

export class BookingRuleError extends Error {}

export interface Transition {
  patch: Partial<BookingState> & { incidentAt?: Date; incidentText?: string };
  event: string;
  changed: boolean; // false si la acción ya estaba hecha (repetirla no hace nada: idempotente)
}

export function transition(b: BookingState, role: Role, action: Action, now: Date, incidentText?: string): Transition {
  const fail = (msg: string): never => {
    throw new BookingRuleError(msg);
  };
  switch (action) {
    case "accept":
    case "decline": {
      if (role !== "owner") fail("Solo el propietario puede aceptar o rechazar");
      const target = action === "accept" ? "accepted" : "declined";
      if (b.status === target) return { patch: {}, event: action, changed: false };
      if (b.status !== "requested") fail("La reserva ya no está pendiente");
      return { patch: { status: target }, event: action, changed: true };
    }
    case "cancel": {
      if (b.status === "cancelled") return { patch: {}, event: action, changed: false };
      const ok = b.status === "requested" ? role === "renter" : b.status === "accepted" && !b.ownerPickedUpAt && !b.renterPickedUpAt;
      if (!ok) fail("Esta reserva ya no se puede cancelar");
      return { patch: { status: "cancelled" }, event: action, changed: true };
    }
    case "pickup": {
      const key = role === "owner" ? "ownerPickedUpAt" : "renterPickedUpAt";
      if (b[key]) return { patch: {}, event: action, changed: false };
      if (b.status !== "accepted") fail("Solo se puede marcar «alquilado» en una reserva aceptada");
      const other = role === "owner" ? b.renterPickedUpAt : b.ownerPickedUpAt;
      return { patch: { [key]: now, ...(other ? { status: "in_progress" as const } : {}) }, event: other ? "pickup_both" : "pickup", changed: true };
    }
    case "return_ok": {
      const key = role === "owner" ? "ownerReturnedOkAt" : "renterReturnedOkAt";
      if (b[key]) return { patch: {}, event: action, changed: false };
      if (b.status !== "in_progress") fail("Solo se puede marcar «finalizado» cuando el alquiler está en curso");
      const other = role === "owner" ? b.renterReturnedOkAt : b.ownerReturnedOkAt;
      return { patch: { [key]: now, ...(other ? { status: "completed" as const } : {}) }, event: other ? "completed" : "return_ok", changed: true };
    }
    case "incident": {
      if (b.status === "incident") return { patch: {}, event: action, changed: false };
      if (b.status !== "accepted" && b.status !== "in_progress") fail("No se puede abrir una incidencia en este estado");
      const text = (incidentText ?? "").trim();
      if (text.length < 5) fail("Describe el problema (mínimo 5 caracteres)");
      return { patch: { status: "incident", incidentAt: now, incidentText: text.slice(0, 2000) }, event: action, changed: true };
    }
  }
}

/** Acciones que la interfaz debe ofrecer a cada parte. */
export function availableActions(b: BookingState, role: Role): Action[] {
  const a: Action[] = [];
  if (b.status === "requested") role === "owner" ? a.push("accept", "decline") : a.push("cancel");
  if (b.status === "accepted") {
    if (!(role === "owner" ? b.ownerPickedUpAt : b.renterPickedUpAt)) a.push("pickup");
    if (!b.ownerPickedUpAt && !b.renterPickedUpAt) a.push("cancel");
    a.push("incident");
  }
  if (b.status === "in_progress") {
    if (!(role === "owner" ? b.ownerReturnedOkAt : b.renterReturnedOkAt)) a.push("return_ok");
    a.push("incident");
  }
  return a;
}

export const STATUS_LABEL: Record<Status, string> = {
  requested: "Solicitada",
  accepted: "Aceptada",
  in_progress: "En curso",
  completed: "Finalizada",
  incident: "Incidencia",
  declined: "Rechazada",
  cancelled: "Cancelada",
  expired: "Caducada",
};

export const ACTION_LABEL: Record<Action, string> = {
  accept: "Aceptar",
  decline: "Rechazar",
  cancel: "Cancelar",
  pickup: "Marcar «alquilado»",
  return_ok: "Marcar «finalizado»",
  incident: "Hay un problema",
};
