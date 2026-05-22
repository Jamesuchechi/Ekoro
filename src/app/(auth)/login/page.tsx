"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Disc, Eye, EyeOff, Loader2 } from "lucide-react";
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
    
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
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
          <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-sm text-white/50 mt-1">Sign in to your Ekoro account</p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-ekoro-green/20 text-ekoro-green rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <h3 className="text-lg font-bold">Successfully Logged In</h3>
            <p className="text-sm text-white/60">Redirecting you to the platform...</p>
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-ekoro-gold hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full pl-4 pr-11 py-2.5 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all ${
                    errors.password
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 focus:border-ekoro-gold/50 focus:bg-white/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-red-500 mt-1.5 block">{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ekoro-blue hover:bg-ekoro-blue/90 disabled:bg-ekoro-blue/50 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-ekoro-blue/20 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <p className="text-center text-xs text-white/50 mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-ekoro-gold hover:underline font-bold">
                Sign Up
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
