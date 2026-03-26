// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // This will be handled by _layout.tsx auth check
  return <Redirect href="/(auth)/login" />;
}