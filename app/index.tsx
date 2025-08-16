//import { Button } from "@react-navigation/elements";
import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>

      <Button onPress={() => router.push("/ChooseRole")} title="Go To Choose Role Page"/>

    </View>
  );
}
