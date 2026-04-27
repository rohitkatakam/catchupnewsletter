export function generateToken(): string {
  throw new Error("not implemented");
}

export async function validateResponseToken(
  _token: string
): Promise<{ valid: boolean; userId?: string; promptId?: string }> {
  throw new Error("not implemented");
}

export async function validateConfirmToken(
  _token: string
): Promise<{ valid: boolean; memberId?: string }> {
  throw new Error("not implemented");
}
