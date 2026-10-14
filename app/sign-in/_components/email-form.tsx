"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { authClient } from "@web/auth/client";
import { Alert, AlertDescription, AlertTitle } from "@web/components/ui/alert";
import { Button } from "@web/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@web/components/ui/field";
import { Input } from "@web/components/ui/input";

type Mode = "sign-in" | "sign-up";

export function EmailAuthForm({
  callbackUrl,
}: {
  readonly callbackUrl: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");

  const submitAuth = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      if (!email.includes("@")) throw new Error("Enter a valid email address.");
      if (password.length < 8)
        throw new Error("Password must be at least 8 characters.");

      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({
              email,
              password,
              name: email.split("@")[0] ?? "User",
            });
      if (result.error) {
        throw new Error(
          mode === "sign-in"
            ? "Sign-in failed. Check your email and password."
            : (result.error.message ?? "Could not create the account.")
        );
      }
    },
    onSuccess: () => {
      router.push(callbackUrl);
      router.refresh();
    },
  });

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    submitAuth.mutate({
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    });
  }

  return (
    <>
      <form
        className="mt-4"
        onSubmit={(event) => {
          submit(event);
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              autoComplete="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              id="password"
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
              type="password"
            />
          </Field>
          <FieldError
            errors={submitAuth.error ? [submitAuth.error] : undefined}
          />
          <Button
            className="w-full"
            disabled={submitAuth.isPending}
            type="submit"
          >
            {submitAuth.isPending
              ? "Please wait..."
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </Button>
        </FieldGroup>
      </form>
      <p className="type-supporting-body text-muted-foreground mt-4 text-center">
        {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
        <button
          className="text-foreground underline underline-offset-4"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            submitAuth.reset();
          }}
          type="button"
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </>
  );
}
