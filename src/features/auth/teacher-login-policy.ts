export function canUseTeacherLogin(roles: readonly string[] | null | undefined): boolean {
  return Array.isArray(roles) && roles.includes("guru");
}
