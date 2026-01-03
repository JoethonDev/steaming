"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default locale login
    router.replace("/ar/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030406]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
        <p className="text-slate-400">Redirecting to login...</p>
      </div>
    </div>
  );
}
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030406] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20">
            <Play className="fill-white w-8 h-8 ml-1" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            S.MASTER PRO
          </h1>
          <p className="text-slate-400">Sign in to your streaming console</p>
        </div>

        <div className="bg-[#0f1116] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-sm flex items-center gap-3">
                <Shield size={18} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Access Dashboard"
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-500 text-sm">
          Don&apos;t have access? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
