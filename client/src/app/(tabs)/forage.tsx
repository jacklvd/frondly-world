import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { tokens } from "@/constants/tokens";

// Forage Capture — ports ForageCaptureView. Tab entry: point the camera at a
// wild plant and capture to identify it.
//
// dev-note: the viewfinder is a placeholder until expo-camera is wired (needs a
// native rebuild). The shutter runs the stubbed identify() via the result route.
export default function ForageCapture() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-start px-4">
        <View className="flex-1">
          <Text className="font-display text-[28px] text-forest">Forage</Text>
          <Text className="font-body text-xs text-secondary">
            Identify wild plants on the trail
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/forage/finds")}
          className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface"
        >
          <Ionicons name="bookmark-outline" size={18} color={tokens.forest} />
        </Pressable>
      </View>

      {/* viewfinder (camera preview placeholder) */}
      <View className="mx-4 mt-4 flex-1 overflow-hidden rounded-[24px] bg-stoneBg">
        <View className="flex-1 items-center justify-center gap-3">
          <Ionicons name="scan-outline" size={40} color={tokens.secondary} />
          <View className="rounded-full bg-forest/90 px-3.5 py-2">
            <Text className="font-body text-[13px] text-white">
              Snap a berry, leaf, or whole plant
            </Text>
          </View>
        </View>
      </View>

      {/* controls */}
      <View
        className="flex-row items-center justify-center px-4"
        style={{ paddingTop: 18, paddingBottom: insets.bottom + 96 }}
      >
        <Pressable
          onPress={() => router.push("/forage/result")}
          // dev-note: long-press previews the low-confidence path until the real
          // model decides confidence. Remove when identify() is wired.
          onLongPress={() => router.push("/forage/result?unsure=1")}
          className="h-[72px] w-[72px] items-center justify-center rounded-full bg-forest"
        >
          <View className="h-[58px] w-[58px] rounded-full border-2 border-citron" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/forage/finds")}
          className="absolute right-8 h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface"
        >
          <Ionicons name="images-outline" size={20} color={tokens.forest} />
        </Pressable>
      </View>

      <Text className="absolute bottom-[76px] w-full text-center font-body text-[11px] text-secondary">
        Field ID aid only — never eat on an app&apos;s word alone.
      </Text>
    </View>
  );
}
