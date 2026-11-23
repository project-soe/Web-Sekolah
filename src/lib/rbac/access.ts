import { z } from "zod";

export const accessSchema = z.object({
  is_super_admin: z.boolean(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export type Access = z.infer<typeof accessSchema>;

export function can(access: Access, code: string) {
  return access.is_super_admin || access.permissions.includes(code);
}
