import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export const Screen = ({ children }: { children: ReactNode }) => (
  <SafeAreaView edges={["top"]} className="flex-1 bg-canvas">
    {children}
  </SafeAreaView>
);
