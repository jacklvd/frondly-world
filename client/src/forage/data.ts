// Forage domain data + a stubbed identifier.
//
// dev-note: identification is MOCKED here. The real flow (on-device model or a
// vision API) lands with api.ts (deferred) — swap `identify()` then; the screens
// consume the return types below and won't need to change.

export type Lookalike = {
  name: string;
  latin: string;
  // false = do-not-eat (toxic/deadly). Drives the blush warning styling.
  safe: boolean;
  danger: string; // "Deadly", "Toxic"
  note: string;
};

export type Species = {
  id: string;
  name: string;
  latin: string;
  edible: boolean;
  ediblePart: string;
  season: string;
  habitat: string;
  range: string;
  // the one toxic lookalike worth calling out on the result card
  lookalike?: Lookalike;
  howToTell: string[];
};

const CATALOG: Record<string, Species> = {
  "red-huckleberry": {
    id: "red-huckleberry",
    name: "Red huckleberry",
    latin: "Vaccinium parvifolium",
    edible: true,
    ediblePart: "Ripe red berries only",
    season: "Berries Jul–Sep",
    habitat: "Conifer forest; on rotting stumps & logs",
    range: "WA · OR · coastal BC — westside",
    lookalike: {
      name: "Red baneberry",
      latin: "Actaea rubra",
      safe: false,
      danger: "Deadly",
      note: "Baneberry's glossy red berries grow in an upright cluster, each with a dark 'eye' — red huckleberry hangs singly from a woody shrub with tiny leaves.",
    },
    howToTell: [
      "Huckleberry berries hang singly from a woody, twiggy shrub with tiny leaves.",
      "Baneberry berries sit in one upright cluster, each with a dark dot (eye).",
      "Baneberry is a soft leafy herb, not a woody shrub.",
    ],
  },
  salmonberry: {
    id: "salmonberry",
    name: "Salmonberry",
    latin: "Rubus spectabilis",
    edible: true,
    ediblePart: "Ripe berries",
    season: "Berries Jun–Jul",
    habitat: "Damp forest edges & stream banks",
    range: "Pacific Northwest — coastal",
    howToTell: [
      "Salmon-to-red raspberry-like berries on a thorny cane.",
      "Pink five-petaled flowers in early spring.",
    ],
  },
  "stinging-nettle": {
    id: "stinging-nettle",
    name: "Stinging nettle",
    latin: "Urtica dioica",
    edible: true,
    ediblePart: "Young leaves — cooked only",
    season: "Spring greens",
    habitat: "Rich moist soil, disturbed ground",
    range: "Widespread",
    howToTell: [
      "Toothed leaves in opposite pairs on a square stem.",
      "Stinging hairs — handle with gloves; cooking neutralizes the sting.",
    ],
  },
  "red-elderberry": {
    id: "red-elderberry",
    name: "Red elderberry",
    latin: "Sambucus racemosa",
    edible: false,
    ediblePart: "Not confirmed — raw berries & seeds are toxic",
    season: "Berries summer",
    habitat: "Moist forest & clearings",
    range: "Pacific Northwest",
    howToTell: [
      "Bright red berries in a dome/pyramid-shaped cluster.",
      "Compound leaves with 5–7 toothed leaflets.",
    ],
  },
  salal: {
    id: "salal",
    name: "Salal",
    latin: "Gaultheria shallon",
    edible: true,
    ediblePart: "Ripe dark-blue berries",
    season: "Berries late summer",
    habitat: "Coastal forest understory",
    range: "Pacific Northwest — coastal",
    howToTell: [
      "Leathery oval evergreen leaves.",
      "Dark blue-black berries, mealy and sweet when ripe.",
    ],
  },
};

export function getSpecies(id: string): Species | undefined {
  return CATALOG[id];
}

// A high-confidence identification (species + confidence %) or a low-confidence
// result with ranked candidates that must not be eaten.
export type IdResult =
  | { kind: "confident"; speciesId: string; confidence: number }
  | {
      kind: "unsure";
      bestGuess: number; // % of the top candidate, below the safe threshold
      candidates: { name: string; latin: string; confidence: number }[];
    };

// Below this we refuse to name the plant.
export const CONFIDENCE_THRESHOLD = 60;

// dev-note: stubbed. Returns a fixed confident match; pass `unsure` to preview
// the low-confidence path until the real model is wired.
export function identify(unsure = false): IdResult {
  if (unsure) {
    return {
      kind: "unsure",
      bestGuess: 41,
      candidates: [
        { name: "Salmonberry", latin: "Rubus spectabilis", confidence: 41 },
        { name: "Red elderberry", latin: "Sambucus racemosa", confidence: 33 },
      ],
    };
  }
  return { kind: "confident", speciesId: "red-huckleberry", confidence: 89 };
}

// dev-note: mocked saved finds until persistence (a WatermelonDB Find model) lands.
export type Find = {
  id: string;
  name: string;
  latin: string;
  location: string;
  date: string;
  status: "edible" | "caution" | "unconfirmed";
};

export const MOCK_FINDS: Find[] = [
  {
    id: "1",
    name: "Salmonberry",
    latin: "Rubus spectabilis",
    location: "Rattlesnake Ledge",
    date: "Jun 18",
    status: "edible",
  },
  {
    id: "2",
    name: "Stinging nettle",
    latin: "Urtica dioica",
    location: "Tiger Mtn",
    date: "Jun 11",
    status: "caution",
  },
  {
    id: "3",
    name: "Red elderberry",
    latin: "Sambucus racemosa",
    location: "Snoqualmie Falls",
    date: "Jun 4",
    status: "caution",
  },
  {
    id: "4",
    name: "Salal",
    latin: "Gaultheria shallon",
    location: "Discovery Park",
    date: "May 28",
    status: "edible",
  },
  {
    id: "5",
    name: "Unknown berry",
    latin: "Not confirmed",
    location: "Cougar Mtn",
    date: "May 20",
    status: "unconfirmed",
  },
];
