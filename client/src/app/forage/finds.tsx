import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip } from "@/components/ui/chip";
import { tokens } from "@/constants/tokens";
import { MOCK_FINDS, type Find } from "@/forage/data";

// Forage Finds — ports ForageFindsView. The forager's log of identified plants
// this season, filterable by edibility.
//
// dev-note: reads mocked finds; swap for a reactive WatermelonDB query when the
// Find model + save flow land.
const FILTERS = ["All", "Edible", "Caution"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_CHIP: Record<
  Find["status"],
  { text: string; bg: "mintBg" | "blushBg" | "stoneBg"; fg: "leafText" | "rust" | "secondary" }
> = {
  edible: { text: "Edible", bg: "mintBg", fg: "leafText" },
  caution: { text: "Caution", bg: "blushBg", fg: "rust" },
  unconfirmed: { text: "Unconfirmed", bg: "stoneBg", fg: "secondary" },
};

export default function ForageFinds() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("All");

  const finds = MOCK_FINDS.filter((f) => {
    if (filter === "Edible") return f.status === "edible";
    if (filter === "Caution") return f.status === "caution";
    return true;
  });

  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentContainerStyle={{
        paddingTop: insets.top + 4,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 24,
        gap: 16,
      }}
    >
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full border border-border bg-surface"
        >
          <Ionicons name="chevron-back" size={16} color={tokens.forest} />
        </Pressable>
        <View className="flex-1">
          <Text className="font-display text-[22px] text-forest">Your finds</Text>
          <Text className="font-body text-xs text-secondary">
            {MOCK_FINDS.length} species · this season
          </Text>
        </View>
      </View>

      {/* filters */}
      <View className="flex-row gap-2">
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={
                active
                  ? "rounded-full bg-forest px-4 py-2"
                  : "rounded-full border border-border bg-surface px-4 py-2"
              }
            >
              <Text
                className="font-body text-[13px] font-semibold"
                style={{ color: active ? tokens.citron : tokens.secondary }}
              >
                {f}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* list */}
      <View className="gap-2.5">
        {finds.map((f) => {
          const chip = STATUS_CHIP[f.status];
          return (
            <View
              key={f.id}
              className="flex-row items-center gap-3 rounded-[16px] border border-border bg-surface p-3"
            >
              <View className="h-12 w-12 items-center justify-center rounded-[12px] bg-sage">
                <Ionicons name="leaf" size={18} color={tokens.leafText} />
              </View>
              <View className="flex-1">
                <Text className="font-display text-[16px] text-forest">{f.name}</Text>
                <Text className="font-body text-[11px] italic text-secondary">{f.latin}</Text>
                <Text className="mt-0.5 font-body text-[11px] text-secondary">
                  {f.location} · {f.date}
                </Text>
              </View>
              <Chip text={chip.text} bg={chip.bg} fg={chip.fg} />
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
