"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Disc, Eye, EyeOff, Loader2, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms of service",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setErrorMsg(null);
    const supabase = createClient();
    
    // Generate clean username from email prefix
    const baseUsername = data.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedUsername = `${baseUsername}_${randomSuffix}`;

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: data.name,
          username: generatedUsername,
          role: "listener",
        },
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      setIsLoading(false);
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-ek-void">
      {/* Visual Column - Hidden on mobile/tablet */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 bg-gradient-to-br from-ek-ink via-ek-void to-ek-surface overflow-hidden border-r border-white/5">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-ek-blue/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-ek-gold/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 noise pointer-events-none opacity-40" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-ek-gold rounded-lg flex items-center justify-center shadow-lg shadow-ek-gold/20">
            <Disc className="w-5 h-5 text-ek-void animate-spin-slow" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-ek-primary">
            Ek<span className="text-ek-gold">oro</span>
          </span>
        </div>

        {/* Feature & Mock Player Visual */}
        <div className="relative z-10 my-auto py-12 flex flex-col items-center">
          {/* Glassmorphic track card */}
          <div className="w-full max-w-sm bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative group overflow-hidden transition-all duration-500 hover:border-white/20 hover:bg-white/10">
            <div className="absolute -inset-x-20 -inset-y-20 bg-gradient-to-tr from-ek-gold/10 via-transparent to-ek-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-3xl" />
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-ek-gold to-ek-blue rounded-xl flex items-center justify-center text-3xl shadow-lg relative overflow-hidden animate-float">
                <div className="absolute inset-0 bg-black/10" />
                <span className="relative z-10">🔥</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-ek-primary truncate text-base">City Boys</h4>
                <p className="text-sm text-ek-secondary truncate">Burna Boy</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-medium tracking-wider uppercase bg-ek-gold-dim text-ek-gold px-2 py-0.5 rounded-full border border-ek-gold/10">
                    Afrobeats
                  </span>
                  <span className="text-[10px] text-ek-tertiary flex items-center gap-1">
                    📈 Trending #1
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated progress */}
            <div className="mt-6 space-y-2 relative z-10">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/5 bg-gradient-to-r from-ek-gold to-ek-blue rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-ek-tertiary font-mono">
                <span>2:05</span>
                <span>3:15</span>
              </div>
            </div>

            {/* Custom mini controls */}
            <div className="flex items-center justify-between mt-5 relative z-10">
              <button className="text-ek-secondary hover:text-ek-primary transition-colors">
                <Heart className="w-4 h-4 fill-ek-gold text-ek-gold" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-ek-primary/30 rounded-full" />
                <div className="w-9 h-9 bg-ek-gold text-ek-void rounded-full flex items-center justify-center shadow-lg shadow-ek-gold/25 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                  <span className="text-xs pl-0.5">▶</span>
                </div>
                <div className="w-2 h-2 bg-ek-primary/30 rounded-full" />
              </div>
              <div className="w-4 h-4 bg-ek-primary/20 rounded-full flex items-center justify-center text-[8px] text-ek-secondary font-mono">
                HQ
              </div>
            </div>
          </div>

          <div className="mt-8 text-center max-w-sm">
            <h3 className="font-display text-2xl font-semibold text-ek-primary mb-3">
              Join the Community
            </h3>
            <p className="text-sm text-ek-secondary leading-relaxed">
              Create an account and start discovering hot trending tracks, customize playlists, and connect with artists from around the globe.
            </p>
          </div>
        </div>

        {/* Visual Footer */}
        <div className="relative z-10 text-xs text-ek-muted">
          &copy; {new Date().getFullYear()} Ekoro. Crafted with care.
        </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-20 bg-ek-void relative overflow-y-auto max-h-screen">
        <div className="absolute top-10 right-10 w-72 h-72 bg-ek-gold/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-ek-blue/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative z-10 py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-ek-gold rounded-lg flex items-center justify-center">
              <Disc className="w-4.5 h-4.5 text-ek-void animate-spin-slow" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-ek-primary">
              Ek<span className="text-ek-gold">oro</span>
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-ek-primary font-display mb-2">Create Account</h2>
            <p className="text-sm text-ek-secondary">Start streaming and downloading on Ekoro</p>
          </div>

          {success ? (
            <div className="text-center py-8 space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl animate-fade-up">
              <div className="w-12 h-12 bg-ek-green/20 text-ek-green rounded-full flex items-center justify-center mx-auto text-lg">
                ✓
              </div>
              <h3 className="text-lg font-bold text-ek-primary font-display">Account Created</h3>
              <p className="text-sm text-ek-secondary leading-relaxed">
                Please check your email to confirm registration before signing in.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block bg-ek-blue hover:bg-ek-blue/90 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-ek-blue/15 hover:-translate-y-[1px] active:translate-y-0"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMsg && (
                <div className="p-4 bg-ek-red/10 border border-ek-red/20 text-ek-red rounded-xl text-xs font-medium flex items-center gap-2.5 animate-fade-up">
                  <span className="w-1.5 h-1.5 bg-ek-red rounded-full flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ek-secondary">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Adekola"
                  {...register("name")}
                  className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all duration-300 ${
                    errors.name
                      ? "border-ek-red/50 focus:border-ek-red focus:ring-1 focus:ring-ek-red/30"
                      : "border-white/10 focus:border-ek-gold/50 focus:bg-white/10 focus:ring-1 focus:ring-ek-gold/20"
                  }`}
                />
                {errors.name && (
                  <span className="text-xs text-ek-red mt-1 block">{errors.name.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ek-secondary">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all duration-300 ${
                    errors.email
                      ? "border-ek-red/50 focus:border-ek-red focus:ring-1 focus:ring-ek-red/30"
                      : "border-white/10 focus:border-ek-gold/50 focus:bg-white/10 focus:ring-1 focus:ring-ek-gold/20"
                  }`}
                />
                {errors.email && (
                  <span className="text-xs text-ek-red mt-1 block">{errors.email.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ek-secondary">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className={`w-full pl-4 pr-11 py-2.5 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all duration-300 ${
                      errors.password
                        ? "border-ek-red/50 focus:border-ek-red focus:ring-1 focus:ring-ek-red/30"
                        : "border-white/10 focus:border-ek-gold/50 focus:bg-white/10 focus:ring-1 focus:ring-ek-gold/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-ek-secondary hover:text-ek-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-xs text-ek-red mt-1 block">{errors.password.message}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ek-secondary">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all duration-300 ${
                    errors.confirmPassword
                      ? "border-ek-red/50 focus:border-ek-red focus:ring-1 focus:ring-ek-red/30"
                      : "border-white/10 focus:border-ek-gold/50 focus:bg-white/10 focus:ring-1 focus:ring-ek-gold/20"
                  }`}
                />
                {errors.confirmPassword && (
                  <span className="text-xs text-ek-red mt-1 block">
                    {errors.confirmPassword.message}
                  </span>
                )}
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register("acceptTerms")}
                    className="mt-0.5 rounded border-white/10 bg-white/5 text-ek-gold accent-ek-gold focus:ring-0 focus:ring-offset-0 transition-colors"
                  />
                  <span className="text-[11px] text-ek-secondary leading-normal group-hover:text-ek-primary transition-colors">
                    I accept the{" "}
                    <a href="#" className="text-ek-gold hover:underline hover:text-ek-gold/80 font-medium">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-ek-gold hover:underline hover:text-ek-gold/80 font-medium">
                      Privacy Policy
                    </a>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <span className="text-xs text-ek-red mt-1.5 block">
                    {errors.acceptTerms.message}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-ek-blue hover:bg-ek-blue/90 disabled:bg-ek-blue/50 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-ek-blue/10 hover:shadow-ek-blue/20 hover:-translate-y-[1px] active:translate-y-0 flex items-center justify-center gap-2 mt-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                  </>
                ) : (
                  "Sign Up"
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
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: `${window.location.origin}/auth/callback` }
                    });
                    if (error) setErrorMsg(error.message);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-sm font-semibold text-ek-primary transition-all duration-200"
                >
                  <svg className="w-4 h-4 text-ek-primary" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = createClient();
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "apple",
                      options: { redirectTo: `${window.location.origin}/auth/callback` }
                    });
                    if (error) setErrorMsg(error.message);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-sm font-semibold text-ek-primary transition-all duration-200"
                >
                  <svg className="w-4 h-4 text-ek-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.5-.63.73-1.18 1.87-1.03 2.98 1.11.09 2.24-.55 2.96-1.42z" />
                  </svg>
                  Apple
                </button>
              </div>

              <p className="text-center text-xs text-ek-secondary mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-ek-gold hover:text-ek-gold/80 hover:underline font-bold transition-colors">
                  Sign In
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
