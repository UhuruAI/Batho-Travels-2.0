"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Field, Input, ThemeToggle } from "@batho/ui";
import { api } from "../../../../convex/_generated/api";
import { readAdminToken, writeAdminToken } from "../_components/useAdminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const signIn = useMutation(api.adminAuth.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already authed, bounce straight to the dashboard.
  useEffect(() => {
    if (readAdminToken()) {
      router.replace("/");
    }
  }, [router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn({ email, password });
      writeAdminToken(result.token);
      router.replace("/");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed.";
      setError(message.replace(/^\[CONVEX[^\]]*\] /, ""));
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-login">
      <div className="admin-login__top">
        <ThemeToggle />
      </div>
      <section className="admin-login__card" aria-labelledby="admin-login-title">
        <div className="admin-login__brand">
          <span className="admin-login__mark">B</span>
          <span className="admin-login__brand-text">
            <small>Batho Travels</small>
            <strong>Admin sign in</strong>
          </span>
        </div>
        <h1 id="admin-login-title" className="admin-login__title">
          Sign in to the operations workspace.
        </h1>
        <p className="admin-login__copy">
          Only authorised Batho Travels staff have access. All sign in attempts are recorded.
        </p>

        <form className="admin-login__form" onSubmit={onSubmit} noValidate>
          <Field id="admin-email" label="Email">
            <Input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="you@batho-travels.co.za"
            />
          </Field>
          <Field id="admin-password" label="Password">
            <Input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
          </Field>

          {error ? (
            <p role="alert" className="admin-login__error">{error}</p>
          ) : null}

          <Button type="submit" block size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="admin-login__footer">
          Need help? Contact <a href="mailto:support@batho-travels.co.za">support@batho-travels.co.za</a>.
        </p>
      </section>
    </main>
  );
}
