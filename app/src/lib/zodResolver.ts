import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

// Small react-hook-form ↔ zod bridge (instead of @hookform/resolvers, whose
// optional peer dependencies don't install cleanly here). First issue per field wins.
export function zodResolver<S extends z.ZodType<FieldValues, FieldValues>>(
  schema: S,
): Resolver<z.input<S>, unknown, z.output<S>> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, unknown> = {};
    for (const issue of result.error.issues) {
      let node = errors;
      issue.path.forEach((key, i) => {
        const k = String(key);
        if (i === issue.path.length - 1) {
          node[k] ??= { type: issue.code, message: issue.message };
        } else {
          node = (node[k] ??= {}) as Record<string, unknown>;
        }
      });
    }
    return { values: {}, errors: errors as FieldErrors<z.input<S>> };
  };
}
