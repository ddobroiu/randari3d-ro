import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.ok) {
      router.push("/");
    } else {
      setError("Email sau parolă incorecte");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 transition-colors">
      <form
        onSubmit={handleLogin}
        className="bg-card text-card-foreground border border-border p-8 rounded-2xl w-full max-w-md space-y-6 shadow-xl"
      >
        <div className="flex items-center justify-center gap-2">
          <LogIn className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Autentificare</h1>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/20 p-2 rounded-lg text-center">
            {error}
          </p>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Parolă"
              className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="text-right text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Ai uitat parola?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white p-3 rounded-lg font-medium hover:opacity-90 transition"
        >
          Intră în cont
        </button>

        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">sau autentifică-te cu:</p>

          <button
            onClick={() => signIn("google")}
            type="button"
            className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg"
          >
            Google
          </button>

          <button
            onClick={() => signIn("facebook")}
            type="button"
            className="w-full bg-blue-800 hover:bg-blue-900 text-white p-3 rounded-lg"
          >
            Facebook
          </button>
        </div>

        <p className="text-sm text-center mt-4">
          Nu ai cont?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Creează cont
          </Link>
        </p>
      </form>
    </div>
  );
}
