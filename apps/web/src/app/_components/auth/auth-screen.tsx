"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { loginAction } from "@/app/_actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const AuthScreen = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction(password, remember);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
        setPassword("");
      }
    });
  };

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-background px-4 py-10">
      <form className="flex w-full max-w-xs flex-col gap-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="auth-password">Password</Label>
          <Input
            aria-invalid={error ? true : undefined}
            autoComplete="current-password"
            autoFocus
            id="auth-password"
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter your password"
            type="password"
            value={password}
          />
          {error ? (
            <p className="text-destructive-foreground text-xs">{error}</p>
          ) : null}
        </div>

        <Label className="gap-2.5" htmlFor="auth-remember">
          <Checkbox
            checked={remember}
            id="auth-remember"
            onCheckedChange={(checked) => setRemember(checked === true)}
          />
          <span className="font-normal text-muted-foreground">
            Remember me on this device
          </span>
        </Label>

        <Button
          className="mt-2 w-full"
          disabled={password.length === 0}
          loading={pending}
          type="submit"
        >
          Unlock
        </Button>
      </form>
    </main>
  );
};
