type PasswordUser = { passwordHash: string } | null;

/** Hər staff giriş cəhdində real və ya dummy hash ilə eyni parol mərhələsini işlədir. */
export async function verifyStaffPassword(
  user: PasswordUser,
  password: string,
  verify: (password: string, hash: string) => Promise<boolean>,
  dummyHash: string,
): Promise<boolean> {
  return verify(password, user?.passwordHash ?? dummyHash);
}
