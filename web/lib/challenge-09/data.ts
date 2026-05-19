import type { Claim } from "./types";
import claimsJson from "./claims.json";

export const claims = claimsJson as unknown as Claim[];
