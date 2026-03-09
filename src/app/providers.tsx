"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { ProgressNotificationUserSync } from "@/contexts/ProgressNotificationContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ProgressNotificationUserSync />
      {children}
    </Provider>
  );
}
