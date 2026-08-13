import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPasswordError } from "../utils/validatePassword";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  const pwError = getPasswordError(password);
  if (pwError) {
    setPasswordError(pwError);
    return;
  }

  try {
    await signup(email, password, name);
    navigate("/dashboard");
  } catch (err: any) {
    setError(err.response?.data?.error || "Signup failed");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 via-cyan-500 to-indigo-600 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-lg mb-3 text-2xl">
            📋
          </div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow-sm">TaskFlow</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/95 backdrop-blur p-8 rounded-2xl shadow-2xl w-full"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Create your account</h2>
          {error && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm">
              {error}
            </p>
          )}
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-xl mb-4 focus:outline-none focus:border-teal-400 transition-colors"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-xl mb-4 focus:outline-none focus:border-teal-400 transition-colors"
            required
          />
          <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    value={password}
    onChange={(e) => {
      setPassword(e.target.value);
      setPasswordError(e.target.value ? getPasswordError(e.target.value) || "" : "");
    }}
    className="w-full border-2 border-gray-200 p-3 pr-11 rounded-xl focus:outline-none focus:border-teal-400 transition-colors"
    required
  />
  <button
    type="button"
    onClick={() => setShowPassword((prev) => !prev)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
    tabIndex={-1}
  >
    {showPassword ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.58 10.58a2 2 0 102.83 2.83" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.88 5.09A9.77 9.77 0 0112 5c5 0 9 4 10 7-.35 1.04-.99 2.17-1.87 3.19M6.1 6.1C3.9 7.5 2.2 9.6 2 12c1 3 5 7 10 7 1.34 0 2.62-.24 3.78-.68" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </button>
</div>
{passwordError && (
  <p className="text-red-500 text-xs mb-4 mt-1">{passwordError}</p>
)}
{!passwordError && (
  <p className="text-gray-400 text-xs mb-4 mt-1">
    Min 8 characters, with uppercase, lowercase, number & special character
  </p>
)}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-semibold p-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg"
          >
            Sign Up
          </button>
          <p className="mt-5 text-sm text-center text-gray-600">
            Have an account?{" "}
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}