import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Chip } from "@/components/ui/chip";
import { SectionLabel } from "@/components/ui/section-label";
import { tokens } from "@/constants/tokens";
import { getSpecies } from "@/forage/data";

// Forage Species Detail — ports ForageDetailView. Full species info: quick
// facts, a side-by-side "tell it apart" comparison with the toxic lookalike,
// and a how-to-tell checklist.
export default function ForageSpecies() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const species = getSpecies(id);

  if (!species) return <View className="flex-1 bg-paper" style={{ paddingTop: insets.top }} />;

  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentContainerStyle={{
        paddingTop: insets.top + 4,
        paddingHorizontal: 16,
        paddingBottom: insets.bottom + 24,
        gap: 20,
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
          <Text className="font-display text-[22px] text-forest" numberOfLines={1}>
            {species.name}
          </Text>
          <Text className="font-body text-xs italic text-secondary" numberOfLines={1}>
            {species.latin}
          </Text>
        </View>
        <Chip
          text={species.edible ? "Edible" : "Caution"}
          bg={species.edible ? "mintBg" : "blushBg"}
          fg={species.edible ? "leafText" : "rust"}
        />
      </View>

      {/* quick facts */}
      <View className="gap-2.5">
        <SectionLabel text="QUICK FACTS" />
        <View className="flex-row flex-wrap justify-between gap-y-2.5">
          <Fact label="Edible part" value={species.ediblePart} />
          <Fact label="Season" value={species.season} />
          <Fact label="Habitat" value={species.habitat} />
          <Fact label="Range" value={species.range} />
        </View>
      </View>

      {/* tell it apart */}
      {species.lookalike ? (
        <View className="gap-2.5">
          <SectionLabel text="TELL IT APART" />
          <View className="flex-row justify-between gap-3">
            <CompareCard
              tone="edible"
              name={species.name}
              latin={species.latin}
              tag="Edible"
              note={species.howToTell[0]}
            />
            <CompareCard
              tone="danger"
              name={species.lookalike.name}
              latin={species.lookalike.latin}
              tag={species.lookalike.danger}
              note={species.lookalike.note}
            />
          </View>
        </View>
      ) : null}

      {/* how to tell */}
      <View className="gap-2.5">
        <SectionLabel text="HOW TO TELL" />
        <View className="gap-2 rounded-[18px] border border-border bg-surface p-3.5">
          {species.howToTell.map((tip) => (
            <View key={tip} className="flex-row gap-2">
              <Ionicons name="ellipse" size={7} color={tokens.leafText} style={{ marginTop: 6 }} />
              <Text className="flex-1 font-body text-[13px] text-forest">{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-[48%] rounded-[14px] border border-border bg-surface p-3">
      <Text className="font-body text-[10px] font-semibold uppercase tracking-wider text-secondary">
        {label}
      </Text>
      <Text className="mt-1 font-body text-[13px] text-forest">{value}</Text>
    </View>
  );
}

function CompareCard({
  tone,
  name,
  latin,
  tag,
  note,
}: {
  tone: "edible" | "danger";
  name: string;
  latin: string;
  tag: string;
  note: string;
}) {
  const edible = tone === "edible";
  return (
    <View
      className="flex-1 gap-1.5 rounded-[16px] p-3"
      style={{ backgroundColor: edible ? tokens.mintBg : tokens.blushBg }}
    >
      <Text className="font-display text-[15px] text-forest">{name}</Text>
      <Text className="font-body text-[11px] italic text-secondary">{latin}</Text>
      <Chip text={tag} bg={edible ? "mintBg" : "blushBg"} fg={edible ? "leafText" : "rust"} />
      <Text className="font-body text-[12px] text-forest">{note}</Text>
    </View>
  );
}
