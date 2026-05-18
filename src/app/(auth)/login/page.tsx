import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-950 rounded-lg shadow-sm border">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            LR TSL Portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access the transport ledger.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
