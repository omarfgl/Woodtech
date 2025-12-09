export type ServiceIdentifier =
  | "gateway"
  | "catalogue"
  | "orders"
  | "mail"
  | "admin"
  | "assistant"
  | "unknown";

export type ServiceDownPayload = {
  service: ServiceIdentifier;
  onRetry?: () => Promise<void> | void;
};

type Listener = (payload: ServiceDownPayload | null) => void;

const listeners = new Set<Listener>();

export function subscribeServiceStatus(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyServiceDown(payload: ServiceDownPayload) {
  listeners.forEach((listener) => listener(payload));
}
