import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-gray-200 p-3 rounded-xl mb-5 focus:outline-none focus:border-teal-400 transition-colors"
            required
          />
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