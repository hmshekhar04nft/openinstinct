import { MessageCircleIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { EmailAuthForm } from "@app/sign-in/_components/email-form";
import { getAuthSession } from "@db/services/auth/session";

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const params = await searchParams;
  const reauthenticate = params.reauthenticate === "true";
  if (!reauthenticate && (await getAuthSession(await headers()))) redirect("/");

  const callbackValue = params.callbackUrl;
  const requestedCallback = Array.isArray(callbackValue)
    ? callbackValue[0]
    : callbackValue;
  const callbackUrl =
    requestedCallback?.startsWith("/") && !requestedCallback.startsWith("//")
      ? requestedCallback
      : "/";

  return (
    <main className="flex min-h-svh items-center justify-center whatsapp-chat-bg px-5 py-8 text-foreground">
      <section className="w-full max-w-sm space-y-6 rounded-3xl border border-border bg-card/95 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><MessageCircleIcon className="size-6" /></span>
          <h1 className="type-page-title">
            {reauthenticate ? "Sign in again" : "Sign In"}
          </h1>
          <p className="type-supporting-body text-muted-foreground">
            Enter your email and password to sign in.
          </p>
        </div>
        <EmailAuthForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
