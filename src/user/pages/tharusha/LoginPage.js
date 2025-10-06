// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api"; // <-- your configured axios instance (baseURL + token header)

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", pwd: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Backend expects { email, pwd }
      const res = await api.post("/api/ITPM/users/login", formData, { timeout: 12000 });
      const data = res?.data || {};

      const token  = data.token ?? data.accessToken ?? data.jwt;
      const role   = String(data.role ?? data.user?.role ?? "").toLowerCase();
      const userId = data.userId ?? data.user?._id ?? data.user?.id;

      if (!token) throw new Error("No token returned from server");

      localStorage.setItem("token", token);
      if (role)   localStorage.setItem("role", role);
      if (userId) localStorage.setItem("userId", userId);

      setSuccess("Login successful — redirecting…");

      // Redirect by role
      if (role === "admin") {
        navigate("/admindashboard", { replace: true });
      } else if (role === "restaurant_manager" || role === "manager") {
        navigate("/managers", { replace: true });
      } else {
        navigate("/", { replace: true }); // regular user
      }
    } catch (err) {
      console.error("Login error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: (err.config?.baseURL || "") + (err.config?.url || ""),
      });
      setError(
        err.response?.data?.message ||
          (err.code === "ECONNABORTED"
            ? "Request timed out. Please try again."
            : "Invalid email or password. Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">Welcome Back</h1>
          <p className="mt-2 text-gray-600">Sign in to your restaurant account</p>
        </div>

        {error && (
          <div id="error-banner" className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div id="success-banner" className="p-3 text-sm text-green-800 bg-green-100 rounded-md">
            {success}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-3 text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="pwd" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                  Forgot password?
                </a>
              </div>
              <input
                id="pwd"
                name="pwd"               // ✅ matches backend (pwd)
                type="password"
                required
                value={formData.pwd}
                onChange={handleChange}
                className="mt-1 w-full px-4 py-3 text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-3 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/signup/user" className="text-blue-600 hover:text-blue-800">
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
