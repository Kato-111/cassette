"use client";

import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { logoutAction } from "@/app/_actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

export const LogoutSection = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.refresh();
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <Field>
        <FieldLabel>Session</FieldLabel>
        <FieldDescription>
          End your session on this device and return to the password screen.
        </FieldDescription>
        <Button
          className="w-fit"
          loading={pending}
          onClick={onLogout}
          size="sm"
          variant="destructive-outline"
        >
          <LogOutIcon />
          Log out
        </Button>
      </Field>
    </section>
  );
};
