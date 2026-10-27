/** The identity data taken from a Google account after a successful consent. */
export interface GoogleProfile {
  email: string;
  name: string;
  /** Google's own flag; unverified emails must never be linked to an account. */
  emailVerified: boolean;
}
