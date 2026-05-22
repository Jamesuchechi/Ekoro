"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Disc, Loader2, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-black p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ekoro-blue/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-ekoro-gold rounded-xl flex items-center justify-center shadow-lg shadow-ekoro-gold/20 mb-3">
            <Disc className="w-7 h-7 text-ekoro-blue-dark animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
          <p className="text-sm text-white/50 mt-1">Request a password recovery link</p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-ekoro-green/20 text-ekoro-green rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <h3 className="text-lg font-bold">Check Your Email</h3>
            <p className="text-sm text-white/60">
              We have sent a password recovery link to your email address if it is registered.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex bg-ekoro-blue text-white font-bold px-6 py-2 rounded-xl text-sm transition-all"
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all ${
                  errors.email
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-ekoro-gold/50 focus:bg-white/10"
                }`}
              />
              {errors.email && (
                <span className="text-xs text-red-500 mt-1.5 block">{errors.email.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ekoro-blue hover:bg-ekoro-blue/90 disabled:bg-ekoro-blue/50 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-ekoro-blue/20 flex items-center justify-center gap-2 mt-2"
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
              className="flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white mt-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
