import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Ship,
  Package,
  Users,
  LogOut,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Anchor,
  Compass,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Globe2,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronDown,
  Navigation,
  FileSpreadsheet
} from 'lucide-react';
import { UserSession, Vessel, ShipmentCargo, CrewMember, VesselStatus, OnlineUser } from './types';
import { INITIAL_VESSELS, INITIAL_CARGO, INITIAL_CREW } from './data/mockShipping';
import { LoginForm } from './components/LoginForm';
import { VesselModal } from './components/VesselModal';
import { CargoModal } from './components/CargoModal';
import { CrewModal } from './components/CrewModal';

interface NotificationToast {
  id: string;
  type: 'success' | 'danger' | 'info';
  message: string;
}

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Active Tab: 'vessels' (Armada Kapal), 'cargo' (Manifest Kargo), 'crew' (Manifest Awak)
  const [activeTab, setActiveTab] = useState<'vessels' | 'cargo' | 'crew'>('vessels');

  // Core Data Collections (Synchronized with Server Database)
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);
  const [cargos, setCargos] = useState<ShipmentCargo[]>(INITIAL_CARGO);
  const [crews, setCrews] = useState<CrewMember[]>(INITIAL_CREW);

  // Online Multi-User System State
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showOnlineDropdown, setShowOnlineDropdown] = useState<boolean>(false);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isVesselModalOpen, setIsVesselModalOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<ShipmentCargo | null>(null);

  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'vessel' | 'cargo' | 'crew';
    id: string;
    title: string;
  } | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'danger' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // --- Real-time Synchronization from Server ---
  const fetchLatestData = useCallback(async (showSyncIndicator = false) => {
    if (showSyncIndicator) setIsSyncing(true);
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.vessels)) setVessels(data.vessels);
        if (Array.isArray(data.cargos)) setCargos(data.cargos);
        if (Array.isArray(data.crews)) setCrews(data.crews);
        if (Array.isArray(data.onlineUsers)) setOnlineUsers(data.onlineUsers);
        setIsConnected(true);
      }
    } catch (err) {
      console.warn('Sync server offline, using local state:', err);
      setIsConnected(false);
    } finally {
      if (showSyncIndicator) {
        setTimeout(() => setIsSyncing(false), 500);
      }
    }
  }, []);

  // Heartbeat Ping untuk User Online
  const sendUserHeartbeat = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/online/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          role: currentUser.role,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setOnlineUsers(data.users);
        }
      }
    } catch (err) {
      console.warn('Heartbeat error:', err);
    }
  }, [currentUser]);

  // Initial load and periodic polling for real-time synchronization
  useEffect(() => {
    fetchLatestData();

    // Auto-sync data every 3.5 seconds agar perubahan dari user lain langsung muncul
    const syncInterval = setInterval(() => {
      fetchLatestData(false);
    }, 3500);

    return () => clearInterval(syncInterval);
  }, [fetchLatestData]);

  // Heartbeat timer when logged in
  useEffect(() => {
    if (!currentUser) return;
    sendUserHeartbeat();
    const heartbeatInterval = setInterval(sendUserHeartbeat, 8000);
    return () => clearInterval(heartbeatInterval);
  }, [currentUser, sendUserHeartbeat]);

  // Handle Logout & Notify Server
  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch('/api/online/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentUser.id }),
        });
      } catch (e) {
        // silent
      }
    }
    setCurrentUser(null);
    showToast('Anda telah keluar dari sistem Japara Bahari Shipping.', 'info');
  };

  // --- CRUD: VESSELS ---
  const handleAddVessel = async (data: Omit<Vessel, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tempId = `VES-${String(vessels.length + 1).padStart(3, '0')}`;
    const optimisticVessel: Vessel = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setVessels((prev) => [optimisticVessel, ...prev]);
    setIsVesselModalOpen(false);

    try {
      const res = await fetch('/api/vessels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticVessel),
      });
      if (res.ok) {
        const saved = await res.json();
        setVessels((prev) => [saved, ...prev.filter((v) => v.id !== optimisticVessel.id)]);
      }
    } catch (err) {
      console.error('Failed to save to server:', err);
    }
    showToast(`Kapal "${data.name}" berhasil didaftarkan secara online.`, 'success');
  };

  const handleUpdateVessel = async (data: Omit<Vessel, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedVessel) return;
    const updatedVessel: Vessel = {
      ...selectedVessel,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setVessels((prev) =>
      prev.map((v) => (v.id === selectedVessel.id ? updatedVessel : v))
    );
    setIsVesselModalOpen(false);
    setSelectedVessel(null);

    try {
      await fetch(`/api/vessels/${selectedVessel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Failed to update on server:', err);
    }
    showToast(`Data kapal "${data.name}" diperbarui di sistem server.`, 'success');
  };

  const handleDeleteVessel = async (id: string) => {
    const target = vessels.find((v) => v.id === id);
    setVessels((prev) => prev.filter((v) => v.id !== id));
    setDeleteConfirm(null);

    try {
      await fetch(`/api/vessels/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete on server:', err);
    }
    showToast(`Kapal "${target?.name || id}" telah dihapus dari armada.`, 'danger');
  };

  // --- CRUD: CARGO ---
  const handleAddCargo = async (data: Omit<ShipmentCargo, 'id' | 'updatedAt'>) => {
    const tempId = `CRG-${Math.floor(1000 + Math.random() * 9000)}`;
    const optimisticCargo: ShipmentCargo = {
      ...data,
      id: tempId,
      updatedAt: new Date().toISOString(),
    };

    setCargos((prev) => [optimisticCargo, ...prev]);
    setIsCargoModalOpen(false);

    try {
      const res = await fetch('/api/cargos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticCargo),
      });
      if (res.ok) {
        const saved = await res.json();
        setCargos((prev) => [saved, ...prev.filter((c) => c.id !== optimisticCargo.id)]);
      }
    } catch (err) {
      console.error('Failed to add cargo to server:', err);
    }
    showToast(`Muatan B/L "${data.trackingNumber}" tersimpan ke database server.`, 'success');
  };

  const handleUpdateCargo = async (data: Omit<ShipmentCargo, 'id' | 'updatedAt'>) => {
    if (!selectedCargo) return;
    const updatedCargo: ShipmentCargo = {
      ...selectedCargo,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    setCargos((prev) =>
      prev.map((c) => (c.id === selectedCargo.id ? updatedCargo : c))
    );
    setIsCargoModalOpen(false);
    setSelectedCargo(null);

    try {
      await fetch(`/api/cargos/${selectedCargo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Failed to update cargo on server:', err);
    }
    showToast(`Manifest B/L "${data.trackingNumber}" berhasil diperbarui.`, 'success');
  };

  const handleDeleteCargo = async (id: string) => {
    const target = cargos.find((c) => c.id === id);
    setCargos((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);

    try {
      await fetch(`/api/cargos/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete cargo on server:', err);
    }
    showToast(`Data muatan "${target?.trackingNumber || id}" berhasil dihapus.`, 'danger');
  };

  // --- CRUD: CREW ---
  const handleAddCrew = async (data: Omit<CrewMember, 'id'>) => {
    const tempId = `CRW-${Math.floor(100 + Math.random() * 900)}`;
    const optimisticCrew: CrewMember = {
      ...data,
      id: tempId,
    };

    setCrews((prev) => [optimisticCrew, ...prev]);
    setIsCrewModalOpen(false);

    try {
      const res = await fetch('/api/crews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticCrew),
      });
      if (res.ok) {
        const saved = await res.json();
        setCrews((prev) => [saved, ...prev.filter((cr) => cr.id !== optimisticCrew.id)]);
      }
    } catch (err) {
      console.error('Failed to add crew on server:', err);
    }
    showToast(`Awak kapal "${data.fullName}" (${data.rank}) berhasil didaftarkan.`, 'success');
  };

  const handleUpdateCrew = async (data: Omit<CrewMember, 'id'>) => {
    if (!selectedCrew) return;
    const updatedCrew: CrewMember = {
      ...selectedCrew,
      ...data,
    };

    setCrews((prev) =>
      prev.map((cr) => (cr.id === selectedCrew.id ? updatedCrew : cr))
    );
    setIsCrewModalOpen(false);
    setSelectedCrew(null);

    try {
      await fetch(`/api/crews/${selectedCrew.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (err) {
      console.error('Failed to update crew on server:', err);
    }
    showToast(`Data pelaut "${data.fullName}" berhasil diperbarui.`, 'success');
  };

  const handleDeleteCrew = async (id: string) => {
    const target = crews.find((cr) => cr.id === id);
    setCrews((prev) => prev.filter((cr) => cr.id !== id));
    setDeleteConfirm(null);

    try {
      await fetch(`/api/crews/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete crew on server:', err);
    }
    showToast(`Awak kapal "${target?.fullName || id}" telah dihapus dari manifest.`, 'danger');
  };

  // Filtered lists
  const filteredVessels = useMemo(() => {
    return vessels.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.imoNumber.includes(searchQuery) ||
        v.callSign.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.captainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.currentPort.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.destinationPort.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vessels, searchQuery, statusFilter]);

  const filteredCargo = useMemo(() => {
    return cargos.filter((c) => {
      const matchSearch =
        c.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.shipper.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.consignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cargoType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cargos, searchQuery, statusFilter]);

  const filteredCrew = useMemo(() => {
    return crews.filter((cr) => {
      const matchSearch =
        cr.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cr.seamanBookNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cr.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cr.vesselName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || cr.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [crews, searchQuery, statusFilter]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalDWT = vessels.reduce((acc, v) => acc + (v.capacityDWT || 0), 0);
    const sailing = vessels.filter((v) => v.status === 'Berlayar').length;
    const berthed = vessels.filter((v) => v.status === 'Bersandar').length;
    const docking = vessels.filter((v) => v.status === 'Docking').length;
    const totalCargoTons = cargos.reduce((acc, c) => acc + (c.weightTons || 0), 0);
    return { totalDWT, sailing, berthed, docking, totalCargoTons };
  }, [vessels, cargos]);

  // TAMPILAN DEFAULT: FORM LOGIN DENGAN SISTEM BEBAS & INDIKATOR ONLINE
  if (!currentUser) {
    return (
      <LoginForm
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Selamat datang di Japara Bahari Shipping, ${user.name}!`, 'success');
        }}
        onlineCount={Math.max(1, onlineUsers.length)}
      />
    );
  }

  // Helper status color
  const getStatusBadge = (status: VesselStatus) => {
    switch (status) {
      case 'Berlayar':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Bersandar':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Docking':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Toast Feedback Notification */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg flex items-start gap-2.5 text-sm transition-all transform animate-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : toast.type === 'danger'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : toast.type === 'danger' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Brand: JAPARA BAHARI SHIPPING */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Anchor className="w-6 h-6" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
                  JAPARA BAHARI SHIPPING
                </span>
                <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <Globe2 className="w-3 h-3 text-blue-600" />
                  Sistem Pelayaran Online Terhubung
                </span>
              </div>
            </div>

            {/* Online Status, Sync & User Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Status Terhubung Server */}
              <div className="relative">
                <button
                  type="button"
                  id="online-users-toggle-btn"
                  onClick={() => setShowOnlineDropdown(!showOnlineDropdown)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                  title="Lihat pengguna lain yang sedang online"
                >
                  <span className="relative flex h-2 w-2">
                    {isConnected && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    ></span>
                  </span>
                  <span className="hidden md:inline">
                    {isConnected ? 'Online Real-Time' : 'Mode Offline'}
                  </span>
                  <span className="px-1.5 py-0.2 bg-white/80 rounded text-[11px] font-bold text-emerald-700 border border-emerald-200">
                    {Math.max(1, onlineUsers.length)} User
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Daftar Pengguna Online */}
                {showOnlineDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Pengguna Terhubung ({Math.max(1, onlineUsers.length)})</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                        Live
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {onlineUsers.length === 0 ? (
                        <div className="p-2 text-xs text-slate-500 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{currentUser.name} (Anda)</span>
                        </div>
                      ) : (
                        onlineUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                              user.id === currentUser.id
                                ? 'bg-blue-50/70 border border-blue-100 text-blue-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                              <div>
                                <div className="font-bold">{user.name} {user.id === currentUser.id ? '(Anda)' : ''}</div>
                                <div className="text-[10px] text-slate-500">{user.role}</div>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">Aktif</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center">
                      Setiap data yang Anda simpan langsung tersinkron ke semua pengguna ini.
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh / Sinkronkan Button */}
              <button
                id="manual-sync-btn"
                onClick={() => fetchLatestData(true)}
                disabled={isSyncing}
                title="Sinkronkan data dengan server sekarang"
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              {/* Info Pengguna Login */}
              <div className="hidden sm:flex flex-col text-right pl-2 border-l border-slate-200">
                <span className="text-xs font-bold text-slate-800">{currentUser.name}</span>
                <span className="text-[11px] text-blue-600 font-medium">{currentUser.role}</span>
              </div>

              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>

              {/* Tombol Logout */}
              <button
                id="logout-button"
                onClick={handleLogout}
                title="Keluar / Ganti User"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Status Terhubung Online */}
        <div className="p-3.5 bg-linear-to-r from-blue-50 via-white to-emerald-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-sm">
                Sistem Terhubung Real-Time Japara Bahari Shipping
              </span>
              <span className="text-slate-600">
                Data armada kapal, muatan kargo, dan manifest ABK tersimpan terpusat dan tersinkronisasi otomatis dengan pengguna lain.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700 shadow-2xs">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Server Online</span>
            </span>
          </div>
        </div>

        {/* KPI Stats Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Total Armada Kapal</div>
              <div className="text-xl font-bold text-slate-900">
                {vessels.length} <span className="text-xs font-normal text-slate-500">Unit</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Sedang Berlayar</div>
              <div className="text-xl font-bold text-emerald-700">
                {stats.sailing} <span className="text-xs font-normal text-slate-500">Kapal</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Kapasitas Muatan Aktif</div>
              <div className="text-xl font-bold text-amber-700">
                {stats.totalCargoTons.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">Ton</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Awak Kapal (ABK)</div>
              <div className="text-xl font-bold text-teal-700">
                {crews.length} <span className="text-xs font-normal text-slate-500">Personel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs and Actions Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
              <button
                id="tab-vessels"
                onClick={() => {
                  setActiveTab('vessels');
                  setStatusFilter('ALL');
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'vessels'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ship className="w-4 h-4" />
                <span>Manajemen Armada ({vessels.length})</span>
              </button>

              <button
                id="tab-cargo"
                onClick={() => {
                  setActiveTab('cargo');
                  setStatusFilter('ALL');
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'cargo'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Kargo & Muatan ({cargos.length})</span>
              </button>

              <button
                id="tab-crew"
                onClick={() => {
                  setActiveTab('crew');
                  setStatusFilter('ALL');
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'crew'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Manifest Awak ABK ({crews.length})</span>
              </button>
            </div>

            {/* Add Record Button */}
            <div className="flex items-center gap-2.5">
              {activeTab === 'vessels' && (
                <button
                  id="add-vessel-btn"
                  onClick={() => {
                    setSelectedVessel(null);
                    setIsVesselModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Daftarkan Kapal Baru</span>
                </button>
              )}

              {activeTab === 'cargo' && (
                <button
                  id="add-cargo-btn"
                  onClick={() => {
                    setSelectedCargo(null);
                    setIsCargoModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Muatan B/L</span>
                </button>
              )}

              {activeTab === 'crew' && (
                <button
                  id="add-crew-btn"
                  onClick={() => {
                    setSelectedCrew(null);
                    setIsCrewModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Awak Pelaut</span>
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'vessels'
                    ? 'Cari nama kapal, nomor IMO, Call Sign, pelabuhan rute...'
                    : activeTab === 'cargo'
                    ? 'Cari no B/L, shipper, consignee, kapal...'
                    : 'Cari nama pelaut, buku pelaut, pangkat kapal...'
                }
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Semua Status</option>
                {activeTab === 'vessels' && (
                  <>
                    <option value="Berlayar">Berlayar</option>
                    <option value="Bersandar">Bersandar</option>
                    <option value="Docking">Docking</option>
                    <option value="Menunggu Instruksi">Menunggu Instruksi</option>
                  </>
                )}
                {activeTab === 'cargo' && (
                  <>
                    <option value="Manifest">Manifest</option>
                    <option value="Dimuat">Dimuat</option>
                    <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                    <option value="Tiba di Pelabuhan">Tiba di Pelabuhan</option>
                    <option value="Selesai Dibongkar">Selesai Dibongkar</option>
                  </>
                )}
                {activeTab === 'crew' && (
                  <>
                    <option value="Aktif di Kapal">Aktif di Kapal</option>
                    <option value="Cuti">Cuti</option>
                    <option value="Siaga">Siaga (Standby)</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Tab 1: DATA ARMADA KAPAL */}
        {activeTab === 'vessels' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Nama Kapal & IMO</th>
                    <th className="py-3.5 px-4">Tipe & Spesifikasi</th>
                    <th className="py-3.5 px-4">Status & Nahkoda</th>
                    <th className="py-3.5 px-4">Rute (Asal → Tujuan)</th>
                    <th className="py-3.5 px-4">Estimasi Tiba (ETA)</th>
                    <th className="py-3.5 px-4 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredVessels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Ship className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <span className="font-medium block text-slate-600">
                          Tidak ada data kapal yang sesuai
                        </span>
                        <span className="text-[11px]">
                          Silakan ubah kata kunci pencarian atau daftarkan kapal baru.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredVessels.map((vessel) => (
                      <tr key={vessel.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{vessel.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                            <span>IMO {vessel.imoNumber}</span>
                            <span>•</span>
                            <span>Call Sign: {vessel.callSign}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{vessel.type}</div>
                          <div className="text-[11px] text-slate-500">
                            DWT: {vessel.capacityDWT?.toLocaleString()} Ton • Thn {vessel.yearBuilt}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                              vessel.status
                            )}`}
                          >
                            {vessel.status}
                          </span>
                          <div className="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-1">
                            <span>Capt:</span> {vessel.captainName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium">{vessel.currentPort}</span>
                          </div>
                          <div className="text-[11px] text-blue-600 font-semibold pl-5">
                            → {vessel.destinationPort}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{vessel.eta.replace('T', ' ')}</span>
                          </div>
                          {vessel.notes && (
                            <div className="text-[10px] text-slate-400 italic truncate max-w-[180px] mt-0.5">
                              {vessel.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              id={`edit-vessel-${vessel.id}`}
                              onClick={() => {
                                setSelectedVessel(vessel);
                                setIsVesselModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Kapal"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-vessel-${vessel.id}`}
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'vessel',
                                  id: vessel.id,
                                  title: vessel.name,
                                })
                              }
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Kapal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: DATA MANIFEST KARGO */}
        {activeTab === 'cargo' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">No. B/L & Tipe</th>
                    <th className="py-3.5 px-4">Kapal Pengangkut</th>
                    <th className="py-3.5 px-4">Pengirim (Shipper) → Penerima</th>
                    <th className="py-3.5 px-4">Pelabuhan Rute</th>
                    <th className="py-3.5 px-4">Berat & Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCargo.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <span className="font-medium block text-slate-600">
                          Tidak ada data muatan kargo
                        </span>
                        <span className="text-[11px]">
                          Silakan tambah muatan kargo baru untuk armada Anda.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredCargo.map((cargo) => (
                      <tr key={cargo.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 font-mono text-sm">
                            {cargo.trackingNumber}
                          </div>
                          <div className="text-[11px] text-amber-700 font-medium">
                            {cargo.cargoType}
                          </div>
                          {cargo.containerNumber && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {cargo.containerNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Ship className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{cargo.vesselName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            ID: {cargo.vesselId}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">Dari: {cargo.shipper}</div>
                          <div className="text-[11px] text-slate-500">Untuk: {cargo.consignee}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-700">{cargo.originPort}</div>
                          <div className="text-[11px] text-blue-600 font-semibold">
                            → {cargo.destinationPort}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {cargo.weightTons?.toLocaleString()} Ton
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 border ${
                              cargo.status === 'Dalam Perjalanan'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : cargo.status === 'Dimuat'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : cargo.status === 'Tiba di Pelabuhan'
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : cargo.status === 'Selesai Dibongkar'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {cargo.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              id={`edit-cargo-${cargo.id}`}
                              onClick={() => {
                                setSelectedCargo(cargo);
                                setIsCargoModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Muatan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-cargo-${cargo.id}`}
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'cargo',
                                  id: cargo.id,
                                  title: cargo.trackingNumber,
                                })
                              }
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Muatan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: DATA MANIFEST AWAK KAPAL (CREW) */}
        {activeTab === 'crew' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Nama Lengkap & Pangkat</th>
                    <th className="py-3.5 px-4">Penugasan Kapal</th>
                    <th className="py-3.5 px-4">Kontak & Kewarganegaraan</th>
                    <th className="py-3.5 px-4">Masa Kontrak & Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCrew.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <span className="font-medium block text-slate-600">
                          Tidak ada data awak pelaut yang sesuai
                        </span>
                        <span className="text-[11px]">
                          Silakan daftarkan ABK atau sesuaikan filter pencarian.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredCrew.map((crew) => (
                      <tr key={crew.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{crew.fullName}</div>
                          <div className="text-[11px] text-teal-700 font-semibold">{crew.rank}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Buku Pelaut: {crew.seamanBookNumber}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Ship className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{crew.vesselName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{crew.phone}</div>
                          <div className="text-[11px] text-slate-500">{crew.nationality}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-700">
                            Exp: <span className="font-medium">{crew.contractExpiry}</span>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 border ${
                              crew.status === 'Aktif di Kapal'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {crew.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              id={`edit-crew-${crew.id}`}
                              onClick={() => {
                                setSelectedCrew(crew);
                                setIsCrewModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Awak"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-crew-${crew.id}`}
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'crew',
                                  id: crew.id,
                                  title: crew.fullName,
                                })
                              }
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Awak"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CRUD MODALS */}
      <VesselModal
        isOpen={isVesselModalOpen}
        onClose={() => {
          setIsVesselModalOpen(false);
          setSelectedVessel(null);
        }}
        onSubmit={selectedVessel ? handleUpdateVessel : handleAddVessel}
        initialData={selectedVessel}
      />

      <CargoModal
        isOpen={isCargoModalOpen}
        onClose={() => {
          setIsCargoModalOpen(false);
          setSelectedCargo(null);
        }}
        onSubmit={selectedCargo ? handleUpdateCargo : handleAddCargo}
        initialData={selectedCargo}
        vessels={vessels}
      />

      <CrewModal
        isOpen={isCrewModalOpen}
        onClose={() => {
          setIsCrewModalOpen(false);
          setSelectedCrew(null);
        }}
        onSubmit={selectedCrew ? handleUpdateCrew : handleAddCrew}
        initialData={selectedCrew}
        vessels={vessels}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Penghapusan</h3>
              <p className="text-xs text-slate-600 mt-1">
                Apakah Anda yakin ingin menghapus data{' '}
                <strong className="text-slate-800 font-semibold">"{deleteConfirm.title}"</strong>?
                Tindakan ini akan disinkronkan ke seluruh pengguna lain yang sedang online.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batalkan
              </button>
              <button
                type="button"
                id="confirm-delete-btn"
                onClick={() => {
                  if (deleteConfirm.type === 'vessel') handleDeleteVessel(deleteConfirm.id);
                  if (deleteConfirm.type === 'cargo') handleDeleteCargo(deleteConfirm.id);
                  if (deleteConfirm.type === 'crew') handleDeleteCrew(deleteConfirm.id);
                }}
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors cursor-pointer"
              >
                Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
