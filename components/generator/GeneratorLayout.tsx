// components/generator/GeneratorLayout.tsx
import React from "react";
import Head from "next/head";
import { FaExclamationTriangle } from "react-icons/fa";

interface GeneratorLayoutProps {
  title: string;
  description: string;
  errorMsg: string | null;
  children: React.ReactNode;
}

export default function GeneratorLayout({ title, description, errorMsg, children }: GeneratorLayoutProps) {
  return (
    <>
      <Head>
        <title>{title} | Randări 3D</title>
        <meta name="description" content={description} />
      </Head>
      
      <main className="min-h-screen py-10 px-2 sm:px-6 md:px-12 bg-transparent text-slate-900 dark:text-white font-sans transition-colors">
        {/* Alertă eroare globală */}
        {errorMsg && (
          <div className="max-w-3xl mx-auto mb-5 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-800 px-6 py-3 rounded-xl shadow-md animate-bounce">
            <FaExclamationTriangle /> {errorMsg}
          </div>
        )}

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
            {children}
        </div>
      </main>
    </>
  );
}