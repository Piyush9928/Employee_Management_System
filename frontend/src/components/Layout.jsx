import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  FileText,
  LogOut,
  Building2,
  Menu,
  X
} from "lucide-react";

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/employees", label: "Employees", icon: Users, roles: ["admin", "hr"] },
    { path: "/attendance", label: "Attendance", icon: Clock },
    { path: "/leaves", label: "Leave Management", icon: Calendar },
    { path: "/reports", label: "Reports", icon: FileText, roles: ["admin", "hr"] }
  ];

  const filteredMenuItems = menuItems.filter(
    item => !item.roles || item.roles.includes(user?.role)
  );

  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <button
        onClick={() => {
          navigate(item.path);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
          isActive
            ? "bg-blue-900 text-white shadow-lg"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>AEMS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-200 shadow-xl z-40 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  AEMS
                </h1>
                <p className="text-xs text-slate-500">Employee Management</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
                {user?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <MenuItem key={item.path} item={item} />
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start space-x-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              data-testid="logout-button"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;