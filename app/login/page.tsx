import LoginForm from "@/components/login-form";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Specify - Login",
  description: "Specify Logistics Management System",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-blue-950 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-white p-2.5 flex items-center justify-center shadow-xl border border-slate-700/50 mb-4">
            <Image
              src="/specify_logistics.jpeg"
              alt="Specify Logistics Logo"
              width={64}
              height={64}
              className="object-contain rounded-xl"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">SPECIFY</h1>
          <p className="text-orange-400 font-semibold text-xs uppercase tracking-widest mt-1">
            Logistics Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Secure access for authorized personnel only</p>
        </div>
      </div>
    </main>
  );
}
