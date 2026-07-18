"use client";

import { useActionState } from "react";
import { Recycle } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui/primitives";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-sm p-6">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-3">
          <Recycle size={20} className="text-white" strokeWidth={2.25} />
        </div>
        <p className="font-display text-lg font-semibold">Bank Sampah</p>
        <p className="text-sm text-ink-soft">Masuk untuk mengelola data Karang Taruna</p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <Label htmlFor="password">Password admin</Label>
          <Input id="password" name="password" type="password" required autoFocus placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full" loading={pending}>
          {pending ? "Memeriksa..." : "Masuk"}
        </Button>
        {state?.error && <p className="text-sm text-danger text-center">{state.error}</p>}
      </form>
    </Card>
  );
}
