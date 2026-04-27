export interface SendEmailOptions {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
}

export async function sendEmail(_options: SendEmailOptions): Promise<void> {
  throw new Error("not implemented");
}
