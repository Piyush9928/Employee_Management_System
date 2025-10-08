import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Mail, Phone, Briefcase, Calendar } from "lucide-react";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: "",
    full_name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    date_of_joining: "",
    salary: "",
    address: "",
    emergency_contact: "",
    blood_group: "",
    status: "active"
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const endpoint = editingEmployee ? `/employees/${editingEmployee.id}` : "/employees";
      const method = editingEmployee ? "put" : "post";

      await axios[method](`${API}${endpoint}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Employee ${editingEmployee ? "updated" : "added"} successfully`);
      setIsModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to delete employee");
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      date_of_joining: employee.date_of_joining,
      salary: employee.salary.toString(),
      address: employee.address || "",
      emergency_contact: employee.emergency_contact || "",
      blood_group: employee.blood_group || "",
      status: employee.status
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      full_name: "",
      email: "",
      phone: "",
      department: "",
      designation: "",
      date_of_joining: "",
      salary: "",
      address: "",
      emergency_contact: "",
      blood_group: "",
      status: "active"
    });
    setEditingEmployee(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Employee Management
            </h1>
            <p className="text-lg text-slate-600">Manage your workforce efficiently</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600 text-white shadow-lg"
            data-testid="add-employee-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Search Bar */}
        <div className="glass-card p-4 rounded-xl">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, employee ID, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-11 border-2 border-slate-200"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Employee Cards */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="glass-card p-12 rounded-xl text-center">
            <p className="text-slate-500 text-lg">No employees found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className="glass-card p-6 rounded-xl hover-lift"
                data-testid={`employee-card-${employee.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {employee.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{employee.full_name}</h3>
                      <p className="text-sm text-slate-600">{employee.employee_id}</p>
                    </div>
                  </div>
                  <span className={`status-badge status-${employee.status}`}>
                    {employee.status}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Briefcase className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{employee.designation}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{employee.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>Joined: {employee.date_of_joining}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Department</p>
                    <p className="text-sm font-semibold text-slate-900">{employee.department}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(employee)}
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-900 hover:bg-blue-50"
                      data-testid={`edit-employee-${employee.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(employee.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      data-testid={`delete-employee-${employee.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="employee-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID *</Label>
                  <Input
                    id="employee_id"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    required
                    disabled={editingEmployee !== null}
                    data-testid="employee-id-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    data-testid="full-name-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    data-testid="email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    data-testid="phone-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    data-testid="department-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    required
                    data-testid="designation-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_joining">Date of Joining *</Label>
                  <Input
                    id="date_of_joining"
                    name="date_of_joining"
                    type="date"
                    value={formData.date_of_joining}
                    onChange={handleChange}
                    required
                    data-testid="date-joining-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary *</Label>
                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleChange}
                    required
                    data-testid="salary-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    data-testid="emergency-contact-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Input
                    id="blood_group"
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    data-testid="blood-group-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  data-testid="address-input"
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
                  data-testid="submit-employee-button"
                >
                  {editingEmployee ? "Update" : "Add"} Employee
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default EmployeeManagement;