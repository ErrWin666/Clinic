import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Typed wrapper around zodResolver that avoids `as any` casts.
 * Needed because Zod v4 types don't perfectly match react-hook-form's Resolver type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typedResolver<T extends Record<string, unknown>>(schema: ZodType<T>): Resolver<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return zodResolver(schema as any) as unknown as Resolver<T>;
}
