// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#0099ff",
        headerTitleStyle: { color: "#0f172a", fontWeight: "700" },
      }}
    >
      {/* OwnerHome: no header + block swipe-back */}
      <Stack.Screen
        name="OwnerHome"
        options={{ headerShown: false, gestureEnabled: false }}
      />

      {/* RegisterSpace (step 1): custom header inside the screen */}
      <Stack.Screen name="RegisterSpace" options={{ headerShown: false }} />

      {/* AfterSubmitting: custom UI + block swipe-back */}
      <Stack.Screen
        name="AfterSubmitting"
        options={{ headerShown: false, gestureEnabled: false }}
      />

      {/* ChooseRole: hide header */}
      <Stack.Screen name="ChooseRole" options={{ headerShown: false }} />

      {/* Optional extras — add if you have these files */}
      {/* <Stack.Screen name="SetTimeSlots" options={{ headerShown: true, title: "Time Slots" }} /> */}
      {/* <Stack.Screen name="ParkingAgreementScreen" options={{ headerShown: true, title: "Agreement" }} /> */}
      {/* <Stack.Screen name="UserAgreementScreen" options={{ headerShown: true, title: "Terms" }} /> */}
      {/* <Stack.Screen name="About" options={{ title: "About" }} /> */}
      {/* <Stack.Screen name="ContactUs" options={{ title: "Contact Us" }} /> */}
      {/* <Stack.Screen name="PaymentInfo" options={{ title: "Payment Info" }} /> */}

      {/* If you still use this: */}
      <Stack.Screen
        name="RegisterSapceDetails"
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack>
  );
}
