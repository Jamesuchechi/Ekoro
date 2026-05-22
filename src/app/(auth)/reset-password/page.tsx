"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Disc, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setErrorMsg(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: data.password,
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
          <h2 className="text-2xl font-bold tracking-tight">New Password</h2>
          <p className="text-sm text-white/50 mt-1">Choose a secure new password</p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-ekoro-green/20 text-ekoro-green rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <h3 className="text-lg font-bold">Password Reset Successful</h3>
            <p className="text-sm text-white/60">
              Your password has been updated. You can now log in using your new credentials.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block bg-ekoro-blue text-white font-bold px-6 py-2 rounded-xl text-sm transition-all"
              >
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full pl-4 pr-11 py-2 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 focus:border-ekoro-gold/50 focus:bg-white/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("confirmPassword")}
                className={`w-full px-4 py-2 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all ${
                  errors.confirmPassword
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-ekoro-gold/50 focus:bg-white/10"
                }`}
              />
              {errors.confirmPassword && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ekoro-blue hover:bg-ekoro-blue/90 disabled:bg-ekoro-blue/50 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-ekoro-blue/20 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
