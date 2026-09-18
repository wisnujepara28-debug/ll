import React, { useState, useEffect } from 'react';
import { CrewMember, Vessel } from '../types';
import { X, Users, AlertCircle, Check } from 'lucide-react';

interface CrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (crewData: Omit<CrewMember, 'id'>) => void;
  initialData?: CrewMember | null;
  vessels: Vessel[];
}

const RANKS = [
  'Nakhoda / Master',
  'Kepala Kamar Mesin (Chief Engineer)',
  'Mualim I (Chief Officer)',
  'Masinis II (Second Engineer)',
  'Mualim II (Second Officer)',
  'Masinis III (Third Engineer)',
  'Bosun / Mandor Dek',
  'Juru Mudi (Able Seaman)',
  'Juru Minyak (Oiler)',
  'Koki Kapal (Chief Cook)',
];

export const CrewModal: React.FC<CrewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  vessels,
}) => {
  const [formData, setFormData] = useState({
    vesselId: vessels[0]?.id || '',
    fullName: '',
    rank: RANKS[0],
    seamanBookNumber: '',
    nationality: 'Indonesia',
    contractExpiry: '',
    phone: '',
    status: 'Aktif di Kapal' as CrewMember['status'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        vesselId: initialData.vesselId,
        fullName: initialData.fullName,
        rank: initialData.rank,
        seamanBookNumber: initialData.seamanBookNumber,
        nationality: initialData.nationality,
        contractExpiry: initialData.contractExpiry,
        phone: initialData.phone,
        status: initialData.status,
      });
    } else {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setFormData({
        vesselId: vessels[0]?.id || '',
        fullName: '',
        rank: RANKS[0],
        seamanBookNumber: '',
        nationality: 'Indonesia',
        contractExpiry: nextYear.toISOString().slice(0, 10),
        phone: '',
        status: 'Aktif di Kapal',
      });
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen, vessels]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Nama lengkap awak kapal wajib diisi';
    } else if (formData.fullName.trim().length < 3) {
      errs.fullName = 'Nama minimal 3 karakter';
    }

    if (!formData.seamanBookNumber.trim()) {
      errs.seamanBookNumber = 'Nomor Buku Pelaut (Seaman Book) wajib diisi';
    }

    if (!formData.phone.trim()) {
      errs.phone = 'Nomor telepon / kontak darurat wajib diisi';
    }

    if (!formData.contractExpiry) {
      errs.contractExpiry = 'Masa berlaku kontrak laut wajib ditentukan';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    if (!validate()) return;

    const v = vessels.find((item) => item.id === formData.vesselId);

    onSubmit({
      vesselId: formData.vesselId,
      vesselName: v ? v.name : 'Unknown Vessel',
      fullName: formData.fullName.trim(),
      rank: formData.rank,
      seamanBookNumber: formData.seamanBookNumber.trim().toUpperCase(),
      nationality: formData.nationality.trim() || 'Indonesia',
      contractExpiry: formData.contractExpiry,
      phone: formData.phone.trim(),
      status: formData.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-600 text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {initialData ? 'Perbarui Data Awak Kapal (ABK)' : 'Pendaftaran Kru Kapal Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                Buku Pelaut, sertifikasi, penempatan kapal, & kontrak kerja
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Pelaut <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Capt. Hendra Gunawan, M.Mar"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
            />
            {touched.fullName && errors.fullName && (
              <p className="text-[11px] text-red-600 mt-1">{errors.fullName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jabatan / Pangkat Maritim
              </label>
              <select
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kapal Penempatan
              </label>
              <select
                value={formData.vesselId}
                onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                {vessels.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Buku Pelaut (Seaman Book) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="B.049210-IDN"
                value={formData.seamanBookNumber}
                onChange={(e) => setFormData({ ...formData, seamanBookNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-mono uppercase"
              />
              {touched.seamanBookNumber && errors.seamanBookNumber && (
                <p className="text-[11px] text-red-600 mt-1">{errors.seamanBookNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / HP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="+62 812-XXXX-XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
              {touched.phone && errors.phone && (
                <p className="text-[11px] text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Masa Berlaku Kontrak <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.contractExpiry}
                onChange={(e) => setFormData({ ...formData, contractExpiry: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
              {touched.contractExpiry && errors.contractExpiry && (
                <p className="text-[11px] text-red-600 mt-1">{errors.contractExpiry}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Awak Kapal
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CrewMember['status'] })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="Aktif di Kapal">Aktif di Kapal</option>
                <option value="Cuti">Cuti</option>
                <option value="Siaga">Siaga (Standby)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Simpan Data Awak' : 'Daftarkan Awak'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
