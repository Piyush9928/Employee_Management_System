import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

const LeaveManagement = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [formData, setFormData] = useState({
    employee_id: "",
    leave_type: "casual",
    start_date: "",
    end_date: "",
    reason: "",
    days_count: 1
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [leavesRes, employeesRes] = await Promise.all([
        axios.get(`${API}/leaves`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setLeaves(leavesRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/leaves`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Leave application submitted successfully");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to apply for leave");
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/leaves/${leaveId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Leave approved successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to approve leave");
    }
  };

  const handleReject = async (leaveId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/leaves/${leaveId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Leave rejected successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to reject leave");
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      leave_type: "casual",
      start_date: "",
      end_date: "",
      reason: "",
      days_count: 1
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-calculate days
    if (name === "start_date" || name === "end_date") {
      const start = name === "start_date" ? value : formData.start_date;
      const end = name === "end_date" ? value : formData.end_date;
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, days_count: diffDays }));
      }
    }
  };

  const filteredLeaves = filterStatus
    ? leaves.filter(l => l.status === filterStatus)
    : leaves;

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />
    };
    return icons[status];
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Leave Management
            </h1>
            <p className="text-lg text-slate-600">Apply and manage leave requests</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white shadow-lg"
            data-testid="apply-leave-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Apply for Leave
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterStatus("")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === ""
                  ? "bg-blue-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid="filter-all"
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "pending"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid="filter-pending"
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus("approved")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "approved"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid="filter-approved"
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus("rejected")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterStatus === "rejected"
                  ? "bg-red-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid="filter-rejected"
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Leave Cards */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-500 text-lg">No leave requests found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLeaves.map((leave) => (
              <div
                key={leave.id}
                className="glass-card p-6 rounded-xl hover-lift"
                data-testid={`leave-card-${leave.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{leave.employee_name}</h3>
                    <p className="text-sm text-slate-600 capitalize">{leave.leave_type} Leave</p>
                  </div>
                  <span className={`status-badge status-${leave.status} flex items-center space-x-1`}>
                    {getStatusIcon(leave.status)}
                    <span>{leave.status}</span>
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Duration:</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {leave.start_date} to {leave.end_date}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Days:</span>
                    <span className="text-sm font-semibold text-slate-900">{leave.days_count} days</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-1">Reason:</p>
                    <p className="text-sm text-slate-900">{leave.reason}</p>
                  </div>
                </div>

                {leave.status === "pending" && user?.role !== "employee" && (
                  <div className="flex space-x-2 pt-4 border-t border-slate-200">
                    <Button
                      onClick={() => handleApprove(leave.id)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                      data-testid={`approve-leave-${leave.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReject(leave.id)}
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      data-testid={`reject-leave-${leave.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {leave.reviewed_by && (
                  <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                    Reviewed by {leave.reviewed_by}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Apply Leave Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Apply for Leave
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="leave-form">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee *</Label>
                <select
                  id="employee_id"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-4 border-2 border-slate-200 rounded-lg focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  data-testid="employee-select"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave_type">Leave Type *</Label>
                <select
                  id="leave_type"
                  name="leave_type"
                  value={formData.leave_type}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-4 border-2 border-slate-200 rounded-lg focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  data-testid="leave-type-select"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                    data-testid="start-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                    data-testid="end-date-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="days_count">Number of Days</Label>
                <Input
                  id="days_count"
                  name="days_count"
                  type="number"
                  value={formData.days_count}
                  onChange={handleChange}
                  required
                  readOnly
                  className="bg-slate-50"
                  data-testid="days-count-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Please provide a reason for your leave..."
                  className="border-2 border-slate-200 resize-none"
                  data-testid="reason-textarea"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  data-testid="cancel-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-900 to-blue-700"
                  data-testid="submit-leave-button"
                >
                  Submit Application
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default LeaveManagement;