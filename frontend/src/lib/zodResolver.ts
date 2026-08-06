import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Typed wrapper around zodResolver that avoids `as any` casts.
 * Needed because Zod v4 types don't perfectly match react-hook-form's Resolver type.
 */
export function typedResolver<T>(schema: ZodType<T>): Resolver<T> {
  return zodResolver(schema) as unknown as Resolver<T>;
}
