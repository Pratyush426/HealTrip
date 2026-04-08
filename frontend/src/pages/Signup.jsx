import { useState, useEffect } from "react";
import { useSignUp, useUser } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import SpotlightCard from "../components/SpotlightCard";
import Threads from "../components/Threads";
import Button from "../components/Button";
import toast from "react-hot-toast";

export default function Signup() {
  const { signUp, setActive } = useSignUp();
  const { isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.href = "/";
    }
  }, [isLoaded, isSignedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || "",
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      
      toast.success("Account created! Check your email for verification code.");
      
      // Redirect to verification page with email
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(err.errors?.[0]?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 flex justify-center items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Threads amplitude={1} distance={0} color={[0.4, 0.2, 0.8]} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-1"
      >
        <SpotlightCard className="p-8 backdrop-blur-md bg-black/40 border border-white/10 shadow-2xl">
          <h1 className="text-4xl font-heading font-bold text-white mb-2 text-center tracking-tight">
            Join HealTrip
          </h1>
          <p className="text-zinc-400 text-center mb-8 text-sm uppercase tracking-widest">
            Start your healing journey
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent peer"
                placeholder="Full Name"
                id="name"
                disabled={loading}
              />
              <label
                htmlFor="name"
                className="absolute left-0 top-3 text-zinc-500 text-sm transition-all peer-focus:-top-3 peer-focus:text-xs peer-focus:text-blue-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-500"
              >
                Full Name
              </label>
            </div>

            {/* Email */}
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent peer"
                placeholder="Email"
                id="email"
                disabled={loading}
              />
              <label
                htmlFor="email"
                className="absolute left-0 top-3 text-zinc-500 text-sm transition-all peer-focus:-top-3 peer-focus:text-xs peer-focus:text-blue-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-500"
              >
                Email Address
              </label>
            </div>

            {/* Password */}
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-zinc-700 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-transparent peer"
                placeholder="Password"
                id="password"
                disabled={loading}
              />
              <label
                htmlFor="password"
                className="absolute left-0 top-3 text-zinc-500 text-sm transition-all peer-focus:-top-3 peer-focus:text-xs peer-focus:text-blue-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-zinc-500"
              >
                Create Password (min 8 characters)
              </label>
            </div>

            {/* Signup Button */}
            <Button 
              type="submit"
              variant="primary" 
              className="w-full py-4 mt-4 bg-white text-black hover:bg-zinc-200"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-zinc-700"></div>
              <span className="text-zinc-500 text-sm">OR</span>
              <div className="flex-1 h-px bg-zinc-700"></div>
            </div>

            {/* Google Sign Up */}
            <button
              type="button"
              onClick={() => {
                if (signUp) {
                  signUp.authenticateWithRedirect({
                    strategy: "oauth_google",
                    redirectUrl: "/sso-callback",
                    redirectUrlComplete: "/dashboard"
                  });
                }
              }}
              className="w-full py-4 bg-zinc-900 border border-zinc-700 text-white rounded-lg hover:bg-zinc-800 transition flex items-center justify-center gap-3"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-xs text-zinc-500 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-white hover:underline">
              Sign in
            </Link>
          </p>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}
