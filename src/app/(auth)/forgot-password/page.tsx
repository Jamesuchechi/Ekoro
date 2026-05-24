"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Disc, Loader2, ArrowLeft, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setErrorMsg(null);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
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
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-ek-green/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-ek-blue/15 rounded-full blur-[120px] pointer-events-none" />
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
            <div className="absolute -inset-x-20 -inset-y-20 bg-gradient-to-tr from-ek-blue/10 via-transparent to-ek-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-3xl" />
            
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-ek-blue to-ek-green rounded-xl flex items-center justify-center text-3xl shadow-lg relative overflow-hidden animate-float">
                <div className="absolute inset-0 bg-black/10" />
                <span className="relative z-10">🎤</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-ek-primary truncate text-base">Calm Down</h4>
                <p className="text-sm text-ek-secondary truncate">Rema</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-medium tracking-wider uppercase bg-ek-gold-dim text-ek-gold px-2 py-0.5 rounded-full border border-ek-gold/10">
                    Afrobeats
                  </span>
                  <span className="text-[10px] text-ek-tertiary flex items-center gap-1">
                    🔥 9.8M streams
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated progress */}
            <div className="mt-6 space-y-2 relative z-10">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-gradient-to-r from-ek-blue to-ek-green rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-ek-tertiary font-mono">
                <span>2:45</span>
                <span>3:39</span>
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
              Recover Your Library
            </h3>
            <p className="text-sm text-ek-secondary leading-relaxed">
              Don&apos;t lose access to your hand-curated playlists, offline downloads, and liked songs. Set up a new password in just a minute.
            </p>
          </div>
        </div>

        {/* Visual Footer */}
        <div className="relative z-10 text-xs text-ek-muted">
          &copy; {new Date().getFullYear()} Ekoro. Crafted with care.
        </div>
      </div>

      {/* Form Column */}
      <div className="flex-1 lg:col-span-7 flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-20 bg-ek-void relative">
        <div className="absolute top-10 right-10 w-72 h-72 bg-ek-gold/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-ek-blue/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-ek-gold rounded-lg flex items-center justify-center">
              <Disc className="w-4.5 h-4.5 text-ek-void animate-spin-slow" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-ek-primary">
              Ek<span className="text-ek-gold">oro</span>
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-ek-primary font-display mb-2">Reset Password</h2>
            <p className="text-sm text-ek-secondary">Request a password recovery link</p>
          </div>

          {success ? (
            <div className="text-center py-8 space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl animate-fade-up">
              <div className="w-12 h-12 bg-ek-green/20 text-ek-green rounded-full flex items-center justify-center mx-auto text-lg">
                ✓
              </div>
              <h3 className="text-lg font-bold text-ek-primary font-display">Check Your Email</h3>
              <p className="text-sm text-ek-secondary leading-relaxed">
                We have sent a password recovery link to your email address if it is registered.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex bg-ek-blue hover:bg-ek-blue/90 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-ek-blue/15 hover:-translate-y-[1px] active:translate-y-0"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errorMsg && (
                <div className="p-4 bg-ek-red/10 border border-ek-red/20 text-ek-red rounded-xl text-xs font-medium flex items-center gap-2.5 animate-fade-up">
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
                      ? "border-ek-red/50 focus:border-ek-red focus:ring-1 focus:ring-ek-red/30"
                      : "border-white/10 focus:border-ek-gold/50 focus:bg-white/10 focus:ring-1 focus:ring-ek-gold/20"
                  }`}
                />
                {errors.email && (
                  <span className="text-xs text-ek-red mt-1.5 block">{errors.email.message}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-ek-blue hover:bg-ek-blue/90 disabled:bg-ek-blue/50 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-ek-blue/10 hover:shadow-ek-blue/20 hover:-translate-y-[1px] active:translate-y-0 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-xs text-ek-secondary hover:text-ek-primary transition-colors py-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
