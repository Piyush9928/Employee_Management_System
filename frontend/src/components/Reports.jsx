import React, { useState } from "react";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Download, Calendar } from "lucide-react";

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API}/reports/attendance?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportData(response.data);
      toast.success("Report generated successfully");
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    const csvContent = [
      ["Employee ID", "Employee Name", "Present", "Absent", "Half Day", "Leave", "Total Hours"],
      ...reportData.data.map(row => [
        row.employee_id,
        row.employee_name,
        row.present,
        row.absent,
        row.half_day,
        row.leave,
        row.total_hours.toFixed(2)
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${year}_${month}.csv`;
    a.click();
    toast.success("Report downloaded successfully");
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Reports & Analytics
          </h1>
          <p className="text-lg text-slate-600">Generate comprehensive attendance reports</p>
        </div>

        {/* Report Generator */}
        <div className="glass-card p-8 rounded-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Attendance Report Generator
              </h2>
              <p className="text-sm text-slate-600">Select month and year to generate detailed report</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="month" className="text-slate-700 font-semibold">Month</Label>
              <select
                id="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full h-12 px-4 border-2 border-slate-200 rounded-lg focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                data-testid="month-select"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-slate-700 font-semibold">Year</Label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-12 px-4 border-2 border-slate-200 rounded-lg focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                data-testid="year-select"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>

            <Button
              onClick={generateReport}
              disabled={loading}
              className="h-12 bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white shadow-lg"
              data-testid="generate-report-button"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Report Display */}
        {reportData && (
          <div className="glass-card rounded-xl overflow-hidden fade-in">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  Attendance Report
                </h3>
                <p className="text-sm text-slate-600">
                  {new Date(reportData.year, reportData.month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Button
                onClick={downloadReport}
                variant="outline"
                className="border-blue-900 text-blue-900 hover:bg-blue-50"
                data-testid="download-report-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee Name</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Half Day</th>
                    <th>Leave</th>
                    <th>Total Hours</th>
                    <th>Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.map((row, index) => {
                    const totalDays = row.present + row.absent + row.half_day + row.leave;
                    const attendanceRate = totalDays > 0 ? ((row.present + row.half_day * 0.5) / totalDays * 100).toFixed(1) : 0;
                    
                    return (
                      <tr key={index} data-testid={`report-row-${index}`}>
                        <td className="font-semibold text-slate-900">{row.employee_id}</td>
                        <td className="text-slate-900">{row.employee_name}</td>
                        <td className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                            {row.present}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 font-semibold">
                            {row.absent}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-semibold">
                            {row.half_day}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                            {row.leave}
                          </span>
                        </td>
                        <td className="font-semibold text-slate-900 text-center">
                          {row.total_hours.toFixed(1)}h
                        </td>
                        <td className="text-center">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                                style={{ width: `${attendanceRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 min-w-[45px]">
                              {attendanceRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!reportData && !loading && (
          <div className="glass-card p-12 rounded-xl text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-500 text-lg">Select a month and year to generate report</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;