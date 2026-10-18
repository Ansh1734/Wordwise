import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined;

export function canSendVerificationEmail(): boolean {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);
}

export async function sendPasswordResetCodeEmail(toEmail: string, code: string): Promise<string | null> {
  if (!canSendVerificationEmail()) {
    return "Email service is not configured. Add EmailJS keys in .env.";
  }

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID!,
      EMAILJS_TEMPLATE_ID!,
      {
        to_name: toEmail.split("@")[0] || "User",
        to_email: toEmail,
        user_email: toEmail,
        email: toEmail,
        reply_to: toEmail,
        from_name: "WordWise",
        from_email: "no-reply@wordwise.app",
        subject: "WordWise verification code",
        message: `Your WordWise verification code is ${code}.`,
        verification_code: code,
        passcode: code,
        otp: code,
        app_name: "WordWise",
      },
      { publicKey: EMAILJS_PUBLIC_KEY! },
    );
    return null;
  } catch (error: unknown) {
    if (typeof error === "object" && error && "status" in error) {
      const status = String((error as { status?: number }).status ?? "");
      const text = String((error as { text?: string }).text ?? "");
      if (status === "422") {
        return `Email template rejected request (422). Check EmailJS template variables/service settings. ${text}`.trim();
      }
      return `Email sending failed (${status}). ${text}`.trim();
    }
    return "Failed to send verification email. Please try again.";
  }
}
