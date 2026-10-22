import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  Phone,
  Building,
  Trash2,
  Edit3,
  Search,
  Filter,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { freshTestApi } from '../../lib/fresh-test-api.ts';

interface Employee {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'SALES_TEAM' | 'STAFF' | 'MANAGER' | 'SUB_ADMIN';
  department: string;
  status: 'active' | 'suspended';
  permissions: string[];
  assignedLeadsCount?: number;
  createdAt: string;
}

const AVAILABLE_PERMISSIONS: { key: string; label: string; desc: string }[] = [
  {
    key: 'leads:manage',
    label: 'CRM Leads & Inquiries',
    desc: 'View, call, follow up, and manage leads received from website inquiry form.'
  },
  {
    key: 'clients:manage',
    label: 'Client Management',
    desc: 'View client accounts, business profiles, and manage onboarding status.'
  },
  {
    key: 'businesses:view',
    label: 'Businesses & QR Codes',
    desc: 'Inspect registered businesses, Google review links, and QR codes.'
  },
  {
    key: 'subscriptions:manage',
    label: 'Plans & Subscriptions',
    desc: 'View client plan tiers, credit quotas, and update limits.'
  },
  {
    key: 'analytics:view',
    label: 'Platform Analytics',
    desc: 'Access conversion metrics, review generation stats, and system performance.'
  },
  {
    key: 'settings:manage',
    label: 'System & AI Settings',
    desc: 'View and edit Gemini AI engine models, fallback modes, and platform config.'
  },
  {
    key: 'audit_logs:view',
    label: 'Security Audit Logs',
    desc: 'View platform audit history, security timestamps, and administrative actions.'
  }
];

export const SuperAdminEmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'SALES_TEAM' | 'STAFF' | 'MANAGER' | 'SUB_ADMIN'>('SALES_TEAM');
  const [newDepartment, setNewDepartment] = useState('Sales & Inquiries');
  const [newPermissions, setNewPermissions] = useState<string[]>(['leads:manage']);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit Permissions Modal
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'SALES_TEAM' | 'STAFF' | 'MANAGER' | 'SUB_ADMIN'>('SALES_TEAM');
  const [editDepartment, setEditDepartment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const list = await freshTestApi.getAdminEmployees();
      setEmployees(list || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleTogglePermission = (key: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditPermissions(prev =>
        prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
      );
    } else {
      setNewPermissions(prev =>
        prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
      );
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPhone.trim()) {
      setErrorMessage('Please fill in name, email, and phone number.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await freshTestApi.createAdminEmployee({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        password: newPassword.trim() || 'Sai@@2907crm',
        role: newRole,
        department: newDepartment.trim(),
        permissions: newPermissions
      });

      setSuccessMessage(`Employee "${newName}" added successfully with custom access permissions.`);
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewPermissions(['leads:manage']);
      await loadEmployees();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditPermissions([...emp.permissions]);
    setEditRole(emp.role);
    setEditDepartment(emp.department || 'General');
    setEditPassword('');
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee) return;
    try {
      setSavingEdit(true);
      setErrorMessage(null);
      await freshTestApi.updateAdminEmployee(editingEmployee.uid, {
        permissions: editPermissions,
        role: editRole,
        department: editDepartment,
        ...(editPassword.trim() ? { password: editPassword.trim() } : {})
      });

      setSuccessMessage(`Permissions for ${editingEmployee.name} updated successfully.`);
      setEditingEmployee(null);
      await loadEmployees();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update employee');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const nextStatus = emp.status === 'active' ? 'suspended' : 'active';
    try {
      await freshTestApi.updateAdminEmployee(emp.uid, { status: nextStatus });
      setSuccessMessage(`Employee ${emp.name} marked as ${nextStatus}.`);
      await loadEmployees();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update employee status');
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!window.confirm(`Are you sure you want to remove employee "${emp.name}"?`)) {
      return;
    }
    try {
      await freshTestApi.deleteAdminEmployee(emp.uid);
      setSuccessMessage(`Employee ${emp.name} removed successfully.`);
      await loadEmployees();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete employee');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.phone.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'ALL' || emp.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Team & Employee Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Add team members, assign operational roles, and customize granular access permissions across ReviewFlow.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">Total Staff</div>
          <div className="text-2xl font-bold text-slate-900">{employees.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">Active Staff</div>
          <div className="text-2xl font-bold text-emerald-600">
            {employees.filter(e => e.status === 'active').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">Sales Specialists</div>
          <div className="text-2xl font-bold text-blue-600">
            {employees.filter(e => e.role === 'SALES_TEAM').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-medium text-slate-500">Suspended</div>
          <div className="text-2xl font-bold text-slate-400">
            {employees.filter(e => e.status === 'suspended').length}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:border-blue-600 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="SALES_TEAM">Sales Team</option>
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
            <option value="SUB_ADMIN">Sub Admin</option>
          </select>
          <button
            onClick={loadEmployees}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
            title="Refresh employees"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Employees Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading employees...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">No employees found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || filterRole !== 'ALL'
                ? 'Try adjusting your search criteria or role filters.'
                : 'Click "Add Employee" above to grant custom access to your team members.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Role & Department</th>
                  <th className="px-5 py-3.5">Custom Permissions</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredEmployees.map(emp => (
                  <tr key={emp.uid} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">ID: {emp.uid}</div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    </td>

                    {/* Role & Dept */}
                    <td className="px-5 py-4 space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {emp.role.replace('_', ' ')}
                      </span>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{emp.department || 'Operations'}</span>
                      </div>
                    </td>

                    {/* Custom Permissions */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {emp.permissions && emp.permissions.length > 0 ? (
                          emp.permissions.map(permKey => {
                            const def = AVAILABLE_PERMISSIONS.find(p => p.key === permKey);
                            return (
                              <span
                                key={permKey}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                              >
                                {def?.label || permKey}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No permissions granted</span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
                          emp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{emp.status === 'active' ? 'Active' : 'Suspended'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1 border border-blue-200 cursor-pointer"
                          title="Edit Permissions & Password"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Permissions</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Employee</h3>
                  <p className="text-xs text-slate-500">Create login credentials and customize access permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Email Address (Login) *</label>
                  <input
                    type="email"
                    required
                    placeholder="employee@reviewflow.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter employee password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden cursor-pointer"
                  >
                    <option value="SALES_TEAM">Sales Specialist</option>
                    <option value="MANAGER">Operations Manager</option>
                    <option value="STAFF">Support Staff</option>
                    <option value="SUB_ADMIN">Sub Administrator</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales, Customer Support"
                    value={newDepartment}
                    onChange={e => setNewDepartment(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>

              {/* Granular Permissions Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Custom Access Control Permissions</span>
                  <span className="text-[10px] text-blue-600 font-normal">
                    {newPermissions.length} selected
                  </span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const isChecked = newPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key, false)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold">{perm.label}</div>
                          <div className="text-[11px] text-slate-500 leading-tight">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Save & Create Employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Access: {editingEmployee.name}</h3>
                  <p className="text-xs text-slate-500">{editingEmployee.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Role</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden cursor-pointer"
                  >
                    <option value="SALES_TEAM">Sales Specialist</option>
                    <option value="MANAGER">Operations Manager</option>
                    <option value="STAFF">Support Staff</option>
                    <option value="SUB_ADMIN">Sub Administrator</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={e => setEditDepartment(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Reset Password (leave blank to keep current)</label>
                <input
                  type="password"
                  placeholder="New password..."
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-hidden font-mono"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Custom Access Control Permissions</span>
                  <span className="text-[10px] text-blue-600 font-normal">{editPermissions.length} selected</span>
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map(perm => {
                    const isChecked = editPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        onClick={() => handleTogglePermission(perm.key, true)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold">{perm.label}</div>
                          <div className="text-[11px] text-slate-500 leading-tight">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="px-5 py-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Permission Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
