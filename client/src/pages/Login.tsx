import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 p-4">
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
          noValidate
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Welcome back</h2>
          {error && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm">
              {error}
            </p>
          )}

          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`w-full border-2 p-3 rounded-xl focus:outline-none transition-colors ${
                fieldErrors.email
                  ? "border-red-300 focus:border-red-400"
                  : "border-gray-200 focus:border-fuchsia-400"
              }`}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email}</p>
            )}
          </div>

          <div className="mb-5">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`w-full border-2 p-3 pr-11 rounded-xl focus:outline-none transition-colors ${
                  fieldErrors.password
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-fuchsia-400"
                }`}
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
            {fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white font-semibold p-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                </svg>
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>
          <p className="mt-5 text-sm text-center text-gray-600">
            No account?{" "}
            <Link to="/signup" className="text-fuchsia-600 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}