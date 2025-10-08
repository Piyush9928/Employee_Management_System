import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  Calendar,
  AlertCircle
} from "lucide-react";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <div className="stat-card hover-lift" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-md`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center space-x-1 mt-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-600 font-semibold">{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-lg text-slate-600">
              Here's what's happening with your team today
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Total Employees"
            value={stats?.total_employees || 0}
            color="bg-gradient-to-br from-blue-900 to-blue-700"
          />
          <StatCard
            icon={UserCheck}
            label="Present Today"
            value={stats?.present_today || 0}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            trend={`${stats?.attendance_rate || 0}% attendance`}
          />
          <StatCard
            icon={Clock}
            label="Pending Leaves"
            value={stats?.pending_leaves || 0}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
          />
          <StatCard
            icon={Calendar}
            label="Attendance Rate"
            value={`${stats?.attendance_rate || 0}%`}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Statistics */}
          <div className="chart-container">
            <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Department Overview
            </h2>
            <div className="space-y-3">
              {stats?.department_stats?.length > 0 ? (
                stats.department_stats.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{dept._id || "Unassigned"}</p>
                        <p className="text-sm text-slate-600">{dept.count} employees</p>
                      </div>
                    </div>
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-900 to-blue-600 rounded-full"
                        style={{ width: `${(dept.count / stats.total_employees) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No department data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Leave Requests */}
          <div className="chart-container">
            <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Recent Leave Requests
            </h2>
            <div className="space-y-3">
              {stats?.recent_leaves?.length > 0 ? (
                stats.recent_leaves.map((leave) => (
                  <div key={leave.id} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{leave.employee_name}</p>
                        <p className="text-sm text-slate-600 capitalize">{leave.leave_type} Leave</p>
                      </div>
                      <span className={`status-badge status-${leave.status}`}>
                        {leave.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{leave.start_date} to {leave.end_date}</span>
                      </span>
                      <span>{leave.days_count} days</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pending leave requests</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {user?.role !== "employee" && (
          <div className="chart-container">
            <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.location.href = '/employees'}
                className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all text-left group"
              >
                <Users className="w-8 h-8 text-blue-900 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-slate-900 mb-1">Manage Employees</h3>
                <p className="text-sm text-slate-600">Add, edit, or view employee details</p>
              </button>
              <button
                onClick={() => window.location.href = '/attendance'}
                className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl hover:from-emerald-100 hover:to-emerald-200 transition-all text-left group"
              >
                <Clock className="w-8 h-8 text-emerald-700 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-slate-900 mb-1">Track Attendance</h3>
                <p className="text-sm text-slate-600">Mark and monitor daily attendance</p>
              </button>
              <button
                onClick={() => window.location.href = '/leaves'}
                className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl hover:from-amber-100 hover:to-amber-200 transition-all text-left group"
              >
                <Calendar className="w-8 h-8 text-amber-700 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-slate-900 mb-1">Review Leaves</h3>
                <p className="text-sm text-slate-600">Approve or reject leave applications</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;