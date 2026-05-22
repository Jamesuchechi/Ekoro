"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Disc, Eye, EyeOff, Loader2 } from "lucide-react";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    // Mock registration delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-black p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-ekoro-blue/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-ekoro-gold rounded-xl flex items-center justify-center shadow-lg shadow-ekoro-gold/20 mb-3">
            <Disc className="w-7 h-7 text-ekoro-blue-dark animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
          <p className="text-sm text-white/50 mt-1">Start streaming and downloading on Ekoro</p>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-ekoro-green/20 text-ekoro-green rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <h3 className="text-lg font-bold">Account Created</h3>
            <p className="text-sm text-white/60">
              Please check your email to confirm registration before signing in.
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
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Adekola"
                {...register("name")}
                className={`w-full px-4 py-2 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all ${
                  errors.name
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-ekoro-gold/50 focus:bg-white/10"
                }`}
              />
              {errors.name && (
                <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className={`w-full px-4 py-2 bg-white/5 border rounded-xl text-sm placeholder-white/20 focus:outline-none transition-all ${
                  errors.email
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-ekoro-gold/50 focus:bg-white/10"
                }`}
              />
              {errors.email && (
                <span className="text-xs text-red-500 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                Password
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
                Confirm Password
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

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("acceptTerms")}
                  className="mt-0.5 rounded border-white/10 bg-white/5 accent-ekoro-gold focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-2xs text-white/60 leading-normal">
                  I accept the{" "}
                  <a href="#" className="text-ekoro-gold hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-ekoro-gold hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.acceptTerms && (
                <span className="text-xs text-red-500 mt-1.5 block">
                  {errors.acceptTerms.message}
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>

            <p className="text-center text-xs text-white/50 mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-ekoro-gold hover:underline font-bold">
                Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
