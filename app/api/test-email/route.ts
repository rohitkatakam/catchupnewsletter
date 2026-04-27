import { render } from "@react-email/components";
import { NextResponse } from "next/server";
import ConfirmEmail from "@/emails/ConfirmEmail";
import NewsletterEmail from "@/emails/NewsletterEmail";
import PromptEmail from "@/emails/PromptEmail";
import { sendEmail } from "@/lib/brevo";

const TEST_TO = [{ email: "rohitkatakam@gmail.com", name: "Rohit" }];
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET() {
  const results: Record<string, string> = {};

  try {
    await sendEmail({
      to: TEST_TO,
      subject: "[TEST] Confirm your email",
      html: await render(
        ConfirmEmail({
          confirmUrl: `${BASE_URL}/confirm?token=test-token`,
          groupName: "Test Group",
        })
      ),
    });
    results.ConfirmEmail = "sent";
  } catch (e) {
    results.ConfirmEmail = String(e);
  }

  try {
    await sendEmail({
      to: TEST_TO,
      subject: "[TEST] This week's prompt",
      html: await render(
        PromptEmail({
          prompt: "What's the best meal you've had this week?",
          groupName: "Test Group",
          respondUrl: `${BASE_URL}/respond?token=test-token`,
          unsubscribeUrl: `${BASE_URL}/unsubscribe?token=test-token`,
        })
      ),
    });
    results.PromptEmail = "sent";
  } catch (e) {
    results.PromptEmail = String(e);
  }

  try {
    await sendEmail({
      to: TEST_TO,
      subject: "[TEST] This week's newsletter",
      html: await render(
        NewsletterEmail({
          groupName: "Test Group",
          content:
            "This week everyone agreed that tacos are undefeated. Rohit made a strong case for birria. No disputes.",
          unsubscribeUrl: `${BASE_URL}/unsubscribe?token=test-token`,
        })
      ),
    });
    results.NewsletterEmail = "sent";
  } catch (e) {
    results.NewsletterEmail = String(e);
  }

  return NextResponse.json(results);
}
