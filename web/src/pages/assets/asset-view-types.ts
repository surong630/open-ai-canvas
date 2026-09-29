import type { Asset } from "@/stores/use-asset-store";

export type LibraryAsset = Exclude<Asset, { kind: "entity" }>;
export type AssetSection = "history" | "library";
export type HistoryKind = "all" | "image" | "video" | "audio";
