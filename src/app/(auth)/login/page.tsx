"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Disc, Eye, EyeOff, Loader2, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMsg(null);
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
      return;
    }

    if (!authData.session) {
      setErrorMsg("Could not establish session. Please try again.");
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    // router.push doesn't wait for the cookie to be set; use replace + reload
    // to ensure the session is picked up by the server middleware
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-ek-void">
      {/* Visual Column */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 bg-gradient-to-br from-ek-ink via-ek-void to-ek-surface overflow-hidden border-r border-white/5">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-ek-blue/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-ek-gold/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-ek-gold rounded-lg flex items-center justify-center shadow-lg shadow-ek-gold/20">
            <Disc className="w-5 h-5 text-ek-void animate-spin-slow" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-ek-primary">
            Ek<span className="text-ek-gold">oro</span>
          </span>
        </div>

        <div className="relative z-10 my-auto py-12 flex flex-col items-center">
          <div className="w-full max-w-sm bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-ek-blue to-ek-gold rounded-xl flex items-center justify-center text-3xl shadow-lg animate-float">
                🎵
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-ek-primary truncate text-base">Essence</h4>
                <p className="text-sm text-ek-secondary truncate">Wizkid ft. Tems</p>
              </div>
            </div>
            <div className="mt-6 space-y-2 relative z-10">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-2/5 bg-gradient-to-r from-ek-blue to-ek-gold rounded-full" />
              </div>
            </div>
          </div>
          <div className="mt-8 text-center max-w-sm">
            <h3 className="font-display text-2xl font-semibold text-ek-primary mb-3">
              High-Fidelity Sound
            </h3>
            <p className="text-sm text-ek-secondary leading-relaxed">
              Stream and download music in high definition.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-xs text-ek-muted">
          &copy; {new Date().getFullYear()} Ekoro. Crafted with care.
        </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-20 bg-ek-void relative">
        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-ek-gold rounded-lg flex items-center justify-center">
              <Disc className="w-4 h-4 text-ek-void" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-ek-primary">
              Ek<span className="text-ek-gold">oro</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-ek-primary font-display mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-ek-secondary">Sign in to your Ekoro account</p>
          </div>

          {success ? (
            <div className="text-center py-8 space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-12 h-12 bg-ek-green/20 text-ek-green rounded-full flex items-center justify-center mx-auto text-lg">
                ✓
              </div>
              <h3 className="text-lg font-bold text-ek-primary font-display">Signed In</h3>
              <p className="text-sm text-ek-secondary">Redirecting you now...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errorMsg && (
                <div className="p-4 bg-ek-red/10 border border-ek-red/20 text-ek-red rounded-xl text-xs font-medium flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 bg-ek-red rounded-full flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ek-secondary">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all duration-300 ${
                    errors.email
                      ? "border-ek-red/50 focus:border-ek-red"
                      : "border-white/10 focus:border-ek-gold/50 focus:bg-white/10"
                  }`}
                />
                {errors.email && (
                  <span className="text-xs text-ek-red">{errors.email.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-ek-secondary">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-ek-gold hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={`w-full pl-4 pr-11 py-3 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all duration-300 ${
                      errors.password
                        ? "border-ek-red/50 focus:border-ek-red"
                        : "border-white/10 focus:border-ek-gold/50 focus:bg-white/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-ek-secondary hover:text-ek-primary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-xs text-ek-red">{errors.password.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-ek-blue hover:bg-ek-blue/90 disabled:bg-ek-blue/50 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-x-0 h-px bg-white/10" />
                <span className="relative px-3 text-[10px] font-bold tracking-widest text-ek-secondary uppercase bg-ek-void">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: `${window.location.origin}/auth/callback` },
                    });
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-semibold text-ek-primary transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signInWithOAuth({
                      provider: "apple",
                      options: { redirectTo: `${window.location.origin}/auth/callback` },
                    });
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-sm font-semibold text-ek-primary transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.5-.63.73-1.18 1.87-1.03 2.98 1.11.09 2.24-.55 2.96-1.42z" />
                  </svg>
                  Apple
                </button>
              </div>

              <p className="text-center text-xs text-ek-secondary mt-6">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-ek-gold hover:underline font-bold">
                  Sign Up
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
