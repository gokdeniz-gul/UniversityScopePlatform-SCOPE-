"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Users, FolderKanban, LogOut, Plus, Search, X,
  Award, ChevronDown, Activity, CheckCircle, Pencil, Check,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { getToken, getUser, clearAuth, type AuthUser } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

interface Category { id: string; name: string; createdAt: string; }
interface Announcement { id: string; title: string; category: string; content: string; createdAt: string; }
interface DbUser {
  id: string; email: string; name: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}
interface Project {
  id: string; title: string; owner: string;
  status: "Draft" | "Active" | "Completed";
  teamSize: number; category: string; techStack: string[];
}

const MOCK_PROJECTS: Project[] = [
  { id: "1", title: "AI-Powered Smart Agriculture System", owner: "Ali Yılmaz", status: "Active", teamSize: 3, category: "TÜBİTAK", techStack: ["Python", "TensorFlow", "IoT"] },
  { id: "2", title: "Autonomous Drone Navigation", owner: "Zeynep Özkan", status: "Active", teamSize: 2, category: "Teknofest", techStack: ["C++", "ROS", "Computer Vision"] },
  { id: "3", title: "E-Commerce Platform Development", owner: "Elif Çelik", status: "Draft", teamSize: 4, category: "Course", techStack: ["React", "Node.js", "MongoDB"] },
  { id: "4", title: "Blockchain Voting System", owner: "Burak Arslan", status: "Active", teamSize: 3, category: "TÜBİTAK", techStack: ["Solidity", "Web3", "React"] },
  { id: "5", title: "Smart Home IoT Hub", owner: "Ali Yılmaz", status: "Draft", teamSize: 2, category: "Course", techStack: ["Python", "Raspberry Pi", "MQTT"] },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"All" | "Student" | "Advisor">("All");
  const [filterCategory, setFilterCategory] = useState("All");

  // Category editing
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);

  // Announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "", category: "General", content: "",
  });

  // Auth guard (layout.tsx already handles redirect, but double-check here too)
  useEffect(() => {
    const user = getUser();
    const token = getToken();
    if (!token || !user || user.role !== "ADMIN") {
      router.replace("/login/admin");
      return;
    }
    setAuthUser(user);
  }, [router]);

  // Fetch data once auth is confirmed
  useEffect(() => {
    if (!authUser) return;
    const headers = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      axios.get(`${API_BASE}/admin/categories`),
      axios.get(`${API_BASE}/admin/announcements`),
      axios.get(`${API_BASE}/admin/users`, { headers }),
    ])
      .then(([catRes, annRes, usrRes]) => {
        setCategories(catRes.data.categories);
        setAnnouncements(annRes.data.announcements);
        setUsers(usrRes.data.users);
      })
      .catch(() => toast.error("Failed to load dashboard data"));
  }, [authUser]);

  const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

  // Logout
  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  // ── Category handlers ──────────────────────────────────────────────────────

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) { toast.error("Please enter a category name"); return; }
    try {
      const { data } = await axios.post(
        `${API_BASE}/admin/categories`,
        { name: newCategoryName.trim() },
        { headers: authHeaders() },
      );
      setCategories((prev) => [data.category, ...prev]);
      setNewCategoryName("");
      setShowCategoryModal(false);
      toast.success("Category Created!", { description: "The category has been added.", duration: 3000 });
    } catch {
      toast.error("Failed to create category");
    }
  };

  const startEditingCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryName.trim() || !editingCategoryId) return;
    try {
      const { data } = await axios.put(
        `${API_BASE}/admin/categories/${editingCategoryId}`,
        { name: editingCategoryName.trim() },
        { headers: authHeaders() },
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategoryId ? data.category : c)),
      );
      setEditingCategoryId(null);
      toast.success("Category Updated!", { duration: 3000 });
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await axios.delete(
        `${API_BASE}/admin/categories/${categoryId}`,
        { headers: authHeaders() },
      );
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      toast.success("Category Deleted!", { duration: 3000 });
    } catch {
      toast.error("Failed to delete category. It may be used by existing projects.");
    }
  };

  // ── Announcement handlers ──────────────────────────────────────────────────

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const { data } = await axios.post(
        `${API_BASE}/admin/announcements`,
        newAnnouncement,
        { headers: authHeaders() },
      );
      setAnnouncements((prev) => [data.announcement, ...prev]);
      setShowCreateModal(false);
      setNewAnnouncement({ title: "", category: "General", content: "" });
      toast.success("Announcement Published!", { duration: 4000 });
    } catch {
      toast.error("Failed to create announcement");
    }
  };

  // ── User handlers ──────────────────────────────────────────────────────────

  const handleToggleUserStatus = async (userId: string, currentStatus: "ACTIVE" | "INACTIVE") => {
    try {
      const { data } = await axios.put(
        `${API_BASE}/admin/users/${userId}/toggle-status`,
        {},
        { headers: authHeaders() },
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: data.user.status } : u)),
      );
      toast.success(`User ${currentStatus === "ACTIVE" ? "Deactivated" : "Activated"}`, { duration: 3000 });
    } catch {
      toast.error("Failed to update user status");
    }
  };

  // ── Filters ────────────────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase());
    const displayRole = u.role === "INSTRUCTOR" ? "Advisor" : u.role === "STUDENT" ? "Student" : "Admin";
    const matchesRole = filterRole === "All" || displayRole === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredProjects = MOCK_PROJECTS.filter((p) => {
    const matchesSearch =
      !projectSearchQuery ||
      p.title.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.owner.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.techStack.some((t) => t.toLowerCase().includes(projectSearchQuery.toLowerCase()));
    const matchesCategory = filterCategory === "All" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (!authUser) return null;

  const displayName = authUser.name ?? "System Admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 relative overflow-hidden">
      <Toaster position="bottom-right" />

      {/* Background grain texture */}
      <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNiIvPjwvc3ZnPg==')]" />

      {/* Top Navigation Bar */}
      <nav className="relative z-20 px-8 py-4">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <Award className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">SCOPE</div>
            <span className="px-4 py-1 bg-purple-500/30 text-purple-200 rounded-full text-xs font-semibold border border-purple-400/30">
              Admin
            </span>
          </div>

          {/* Profile Area */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-4 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="text-white/60 text-xs">Admin Panel</p>
                <p className="text-white font-semibold">{displayName}</p>
              </div>
              <ChevronDown className="w-5 h-5 text-white/60" strokeWidth={2} />
            </button>

            {showProfileDropdown && (
              <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[30px] shadow-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-6 py-4 text-red-500 hover:bg-red-50 transition-all flex items-center space-x-3 text-left"
                >
                  <LogOut className="w-5 h-5" strokeWidth={2} />
                  <span className="font-medium">Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 px-8 py-6 space-y-6">

        {/* Row 1: Live Stats */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-300" strokeWidth={2} />
              </div>
            </div>
            <p className="text-white/60 text-sm mb-2">Total Users</p>
            <p className="text-white text-4xl font-bold">{users.length}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-purple-300" strokeWidth={2} />
              </div>
            </div>
            <p className="text-white/60 text-sm mb-2">Active Projects</p>
            <p className="text-white text-4xl font-bold">34</p>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-300" strokeWidth={2} />
              </div>
            </div>
            <p className="text-white/60 text-sm mb-2">Team Matches</p>
            <p className="text-white text-4xl font-bold">89</p>
          </div>

          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-yellow-300" strokeWidth={2} />
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-300 text-xs font-semibold">Live</span>
              </div>
            </div>
            <p className="text-white/60 text-sm mb-2">Online Users</p>
            <p className="text-white text-4xl font-bold">42</p>
          </div>
        </div>

        {/* Row 2: User Management + Project Exploration */}
        <div className="grid grid-cols-2 gap-6">
          {/* User Management */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
            <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>

            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>

              <div className="flex space-x-3">
                {(["All", "Student", "Advisor"] as const).map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      filterRole === role
                        ? "bg-blue-500/30 text-blue-200 border border-blue-400/50"
                        : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.map((user) => {
                const displayRole = user.role === "INSTRUCTOR" ? "Advisor" : user.role === "STUDENT" ? "Student" : "Admin";
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-6 py-4 bg-white/10 rounded-[30px] border border-white/20 hover:bg-white/15 transition-all"
                  >
                    <div className="flex-1">
                      <p className="text-white font-semibold">{user.name}</p>
                      <p className="text-white/50 text-sm">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-4 py-2 rounded-full text-xs font-semibold ${
                        displayRole === "Student"
                          ? "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                          : "bg-purple-500/20 text-purple-200 border border-purple-400/30"
                      }`}>
                        {displayRole}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleUserStatus(user.id, user.status)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                          user.status === "ACTIVE"
                            ? "bg-green-500/20 text-green-200 border border-green-400/30 hover:bg-red-500/20 hover:text-red-200 hover:border-red-400/30"
                            : "bg-red-500/20 text-red-200 border border-red-400/30 hover:bg-green-500/20 hover:text-green-200 hover:border-green-400/30"
                        }`}
                      >
                        {user.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <p className="text-center text-white/40 py-8">No users found.</p>
              )}
            </div>
          </div>

          {/* Project Exploration */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
            <h2 className="text-2xl font-bold text-white mb-6">Project Exploration</h2>

            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search by title, owner, or tech stack..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>

              <div className="flex space-x-3">
                {["All", "TÜBİTAK", "Teknofest", "Course"].map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      filterCategory === cat
                        ? "bg-purple-500/30 text-purple-200 border border-purple-400/50"
                        : "bg-white/10 text-white/70 border border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="px-6 py-4 bg-white/10 rounded-[30px] border border-white/20 hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-semibold">{project.title}</p>
                      <p className="text-white/50 text-sm">by {project.owner}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      project.status === "Active"
                        ? "bg-green-500/20 text-green-200 border border-green-400/30"
                        : project.status === "Draft"
                        ? "bg-yellow-500/20 text-yellow-200 border border-yellow-400/30"
                        : "bg-blue-500/20 text-blue-200 border border-blue-400/30"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs border border-blue-400/30">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements Section */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Global Announcements</h2>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>Create Announcement</span>
            </button>
          </div>

          {announcements.length === 0 ? (
            <p className="text-center text-white/40 py-8">No announcements yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white/10 rounded-[40px] border border-white/20 p-6 hover:bg-white/15 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-4 py-2 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                      {ann.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{ann.title}</h3>
                  <p className="text-white/60 text-sm mb-3">{ann.content}</p>
                  <p className="text-white/40 text-xs">{formatDate(ann.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manage Categories Section */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[60px] p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Manage Categories</h2>
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="px-6 py-3 bg-white/90 hover:bg-white text-gray-900 rounded-full font-bold transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>Add Category</span>
            </button>
          </div>

          {categories.length === 0 ? (
            <p className="text-center text-white/40 py-8">No categories yet. Add your first category.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white/10 rounded-[40px] border border-white/20 p-6 hover:bg-white/15 transition-all group"
                >
                  {editingCategoryId === category.id ? (
                    /* ── Edit mode ── */
                    <div className="space-y-3">
                      <input
                        type="text"
                        aria-label="Category name"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateCategory();
                          if (e.key === "Escape") setEditingCategoryId(null);
                        }}
                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-[20px] text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleUpdateCategory}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-[20px] text-green-300 text-xs font-semibold transition-all"
                        >
                          <Check className="w-3 h-3" strokeWidth={2.5} />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategoryId(null)}
                          className="flex-1 flex items-center justify-center py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[20px] text-white/60 text-xs font-semibold transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal mode ── */
                    <div>
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-lg font-bold text-white truncate flex-1 mr-2">
                          {category.name}
                        </h3>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditingCategory(category)}
                            title="Edit category"
                            className="w-8 h-8 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-full flex items-center justify-center transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5 text-blue-300" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(category.id)}
                            title="Delete category"
                            className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-full flex items-center justify-center transition-all"
                          >
                            <X className="w-4 h-4 text-red-300" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                      <p className="text-white/40 text-xs">{formatDate(category.createdAt)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Create Announcement Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Create Announcement</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowCreateModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label htmlFor="ann-category" className="block text-white/80 text-sm font-semibold mb-2">Category</label>
                <select
                  id="ann-category"
                  value={newAnnouncement.category}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, category: e.target.value })}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                >
                  <option value="General" className="text-gray-900">General</option>
                  <option value="TÜBİTAK" className="text-gray-900">TÜBİTAK</option>
                  <option value="Teknofest" className="text-gray-900">Teknofest</option>
                  <option value="Course" className="text-gray-900">Course</option>
                </select>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Content</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  rows={4}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                  placeholder="Enter announcement content"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={handleCreateAnnouncement}
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all"
              >
                Publish Announcement
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-8 py-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-[30px] font-bold text-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Category Modal ── */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white/15 backdrop-blur-2xl rounded-[60px] border border-white/30 p-12 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Create Category</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowCategoryModal(false)}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all border border-white/20"
              >
                <X className="w-6 h-6 text-white" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-semibold mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[30px] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder="Enter category name"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={handleCreateCategory}
                className="flex-1 px-8 py-5 bg-blue-500/30 hover:bg-blue-500/40 border border-blue-400/50 text-blue-200 rounded-[30px] font-bold text-lg transition-all"
              >
                Create Category
              </button>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-8 py-5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-[30px] font-bold text-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
