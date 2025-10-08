import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Clock, Calendar, Filter } from "lucide-react";

const AttendanceManagement = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [formData, setFormData] = useState({
    employee_id: "",
    date: new Date().toISOString().split('T')[0],
    check_in: "",
    check_out: "",
    status: "present"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [attendanceRes, employeesRes] = await Promise.all([
        axios.get(`${API}/attendance`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/employees`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAttendance(attendanceRes.data);
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
      await axios.post(`${API}/attendance`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Attendance marked successfully");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to mark attendance");
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      date: new Date().toISOString().split('T')[0],
      check_in: "",
      check_out: "",
      status: "present"
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredAttendance = filterDate
    ? attendance.filter(a => a.date === filterDate)
    : attendance;

  const getStatusColor = (status) => {
    const colors = {
      present: "bg-emerald-100 text-emerald-700",
      absent: "bg-red-100 text-red-700",
      "half-day": "bg-amber-100 text-amber-700",
      leave: "bg-blue-100 text-blue-700"
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Attendance Management
            </h1>
            <p className="text-lg text-slate-600">Track and manage employee attendance</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white shadow-lg"
            data-testid="mark-attendance-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Mark Attendance
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex-1">
              <Label htmlFor="filterDate" className="text-sm font-medium text-slate-700 mb-2 block">
                Filter by Date
              </Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="max-w-xs border-2 border-slate-200"
                data-testid="filter-date-input"
              />
            </div>
            {filterDate && (
              <Button
                variant="outline"
                onClick={() => setFilterDate("")}
                className="mt-6"
                data-testid="clear-filter-button"
              >
                Clear Filter
              </Button>
            )}
          </div>
        </div>

        {/* Attendance Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-500 text-lg">No attendance records found</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record) => (
                    <tr key={record.id} data-testid={`attendance-row-${record.id}`}>
                      <td className="font-semibold text-slate-900">{record.employee_name}</td>
                      <td className="text-slate-600">{record.employee_id}</td>
                      <td className="text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{record.date}</span>
                        </div>
                      </td>
                      <td className="text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{record.check_in}</span>
                        </div>
                      </td>
                      <td className="text-slate-600">
                        {record.check_out ? (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{record.check_out}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="font-semibold text-slate-900">
                        {record.working_hours ? `${record.working_hours}h` : "-"}
                      </td>
                      <td>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mark Attendance Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Mark Attendance
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="attendance-form">
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
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  data-testid="date-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="check_in">Check In *</Label>
                  <Input
                    id="check_in"
                    name="check_in"
                    type="time"
                    value={formData.check_in}
                    onChange={handleChange}
                    required
                    data-testid="check-in-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check_out">Check Out</Label>
                  <Input
                    id="check_out"
                    name="check_out"
                    type="time"
                    value={formData.check_out}
                    onChange={handleChange}
                    data-testid="check-out-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full h-11 px-4 border-2 border-slate-200 rounded-lg focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                  data-testid="status-select"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-day">Half Day</option>
                  <option value="leave">On Leave</option>
                </select>
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
                  data-testid="submit-attendance-button"
                >
                  Mark Attendance
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AttendanceManagement;