import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Lock, Mail, Building2 } from "lucide-react";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "employee"
  });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      login(response.data.user, response.data.token);
      toast.success(isLogin ? "Login successful!" : "Registration successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:flex flex-col justify-center space-y-6 p-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  RJ Easy Softech Pvt. Ltd.
                </h1>
                <p className="text-slate-600 text-sm">Employee Management System</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Streamline Your Workforce Management
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Intelligent HR automation platform designed to simplify employee management, 
              attendance tracking, and performance monitoring.
            </p>
          </div>

          <div className="space-y-4 pt-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Real-time Tracking</h3>
                <p className="text-sm text-slate-600">Monitor attendance and performance effortlessly</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Secure & Role-based</h3>
                <p className="text-sm text-slate-600">Advanced security with granular access control</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="glass-card rounded-2xl p-8 md:p-10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-slate-600">
              {isLogin ? "Sign in to access your dashboard" : "Register to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-slate-700 font-semibold">Full Name</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required={!isLogin}
                  className="h-12 border-2 border-slate-200 focus:border-blue-900"
                  data-testid="full-name-input"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  required
                  className="h-12 pl-11 border-2 border-slate-200 focus:border-blue-900"
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="h-12 pl-11 border-2 border-slate-200 focus:border-blue-900"
                  data-testid="password-input"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 font-semibold">Role</Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full h-12 px-4 border-2 border-slate-200 rounded-lg focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  data-testid="role-select"
                >
                  <option value="employee">Employee</option>
                  <option value="hr">HR Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
              data-testid="submit-button"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-900 hover:text-blue-700 font-semibold transition-colors"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
          </div>

          {isLogin && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-slate-700 font-semibold mb-2">Demo Credentials:</p>
              <p className="text-xs text-slate-600">Create an account or use your own credentials</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;