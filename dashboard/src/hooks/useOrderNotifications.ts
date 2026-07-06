import { useEffect, useRef, useState } from "react";
import { sellerApi, Order } from "../api";

export function useOrderNotifications(onNewOrder: (count: number) => void, intervalMs = 15000) {
  const knownPending = useRef<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const { data } = await sellerApi.orders();
        const pending = data.filter((o: Order) => o.status === "Pending");
        if (!initialized) {
          pending.forEach((o) => knownPending.current.add(o.id));
          setInitialized(true);
          return;
        }
        const newOrders = pending.filter((o) => !knownPending.current.has(o.id));
        if (newOrders.length > 0) {
          newOrders.forEach((o) => knownPending.current.add(o.id));
          onNewOrder(newOrders.length);
        }
        data.forEach((o: Order) => {
          if (o.status !== "Pending") knownPending.current.delete(o.id);
        });
      } catch {
        // ignore polling errors
      }
    };
    poll();
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [initialized, intervalMs, onNewOrder]);
}
