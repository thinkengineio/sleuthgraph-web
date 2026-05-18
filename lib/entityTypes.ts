/**
 * Entity and relationship type definitions used for icon/color rendering.
 * Decoupled from api.ts so components can import metadata without pulling in fetch logic.
 */

import {
  IconBuilding,
  IconCurrencyBitcoin,
  IconLink,
  IconMail,
  IconPhone,
  IconServer,
  IconUser,
  IconWorld,
} from "@tabler/icons-react";
import type { FC } from "react";

// ── Entity types ────────────────────────────────────────────────────────────

export const ENTITY_TYPES = [
  "PERSON",
  "ORGANIZATION",
  "DOMAIN",
  "IP_ADDRESS",
  "EMAIL",
  "PHONE",
  "URL",
  "CRYPTO_ADDRESS",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export type EntityTypeMeta = {
  icon: FC<{ size?: number; stroke?: number }>;
  color: string;
  label: string;
};

export const ENTITY_TYPE_META: Record<EntityType, EntityTypeMeta> = {
  PERSON: { icon: IconUser, color: "blue", label: "Person" },
  ORGANIZATION: { icon: IconBuilding, color: "grape", label: "Organization" },
  DOMAIN: { icon: IconWorld, color: "teal", label: "Domain" },
  IP_ADDRESS: { icon: IconServer, color: "cyan", label: "IP Address" },
  EMAIL: { icon: IconMail, color: "yellow", label: "Email" },
  PHONE: { icon: IconPhone, color: "pink", label: "Phone" },
  URL: { icon: IconLink, color: "indigo", label: "URL" },
  CRYPTO_ADDRESS: { icon: IconCurrencyBitcoin, color: "orange", label: "Crypto Address" },
};

// ── Relationship types ──────────────────────────────────────────────────────

export const RELATIONSHIP_TYPES = [
  "OWNS",
  "EMPLOYED_BY",
  "REGISTERED_BY",
  "HOSTED_ON",
  "RESOLVES_TO",
  "ASSOCIATED_WITH",
  "COMMUNICATED_WITH",
  "MENTIONS",
  "SUBDOMAIN_OF",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];
