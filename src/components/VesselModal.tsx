import React, { useState, useEffect } from 'react';
import { Vessel, VesselStatus } from '../types';
import { X, Ship, Anchor, AlertCircle, Check, HelpCircle } from 'lucide-react';

interface VesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (vesselData: Omit<Vessel, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Vessel | null;
}

const VESSEL_TYPES = [
  'Container Carrier (Petikemas)',
  'Bulk Carrier (Curah Kering)',
  'Oil & Chemical Tanker (Tangker)',
  'Kendaraan & Penumpang (Ro-Ro)',
  'General Cargo & Logistik',
  'Tugboat & Tongkang',
  'LPG / LNG Gas Carrier',
];

const STATUS_OPTIONS: VesselStatus[] = [
  'Berlayar',
  'Bersandar',
  'Docking',
  'Menunggu Instruksi',
];

export const VesselModal: React.FC<VesselModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    callSign: '',
    type: VESSEL_TYPES[0],
    flag: 'Indonesia',
    capacityDWT: '',
    yearBuilt: '',
    status: 'Bersandar' as VesselStatus,
    captainName: '',
    currentPort: '',
    destinationPort: '',
    eta: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        imoNumber: initialData.imoNumber,
        callSign: initialData.callSign,
        type: initialData.type,
        flag: initialData.flag,
        capacityDWT: initialData.capacityDWT.toString(),
        yearBuilt: initialData.yearBuilt.toString(),
        status: initialData.status,
        captainName: initialData.captainName,
        currentPort: initialData.currentPort,
        destinationPort: initialData.destinationPort,
        eta: initialData.eta,
        notes: initialData.notes || '',
      });
    } else {
      // Default reset untuk kapal baru
      const now = new Date();
      now.setDate(now.getDate() + 3);
      const defaultEta = now.toISOString().slice(0, 16);

      setFormData({
        name: '',
        imoNumber: '',
        callSign: '',
        type: VESSEL_TYPES[0],
        flag: 'Indonesia',
        capacityDWT: '',
        yearBuilt: '2020',
        status: 'Bersandar',
        captainName: '',
        currentPort: '',
        destinationPort: '',
        eta: defaultEta,
        notes: '',
      });
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validasi Nama Kapal
    if (!formData.name.trim()) {
      newErrors.name = 'Nama kapal wajib diisi';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nama kapal minimal 3 karakter';
    }

    // Validasi Nomor IMO (Wajib 7 digit angka sesuai standar maritim internasional)
    const cleanIMO = formData.imoNumber.replace(/\D/g, '');
    if (!formData.imoNumber.trim()) {
      newErrors.imoNumber = 'Nomor IMO maritim internasional wajib diisi';
    } else if (cleanIMO.length !== 7) {
      newErrors.imoNumber = 'Nomor IMO harus tepat 7 digit angka (misal: 9482103)';
    }

    // Validasi Tanda Panggilan (Call Sign)
    if (!formData.callSign.trim()) {
      newErrors.callSign = 'Tanda panggilan (Call Sign) wajib diisi';
    } else if (formData.callSign.trim().length < 3 || formData.callSign.trim().length > 7) {
      newErrors.callSign = 'Call Sign harus antara 3 sampai 7 karakter alfanumerik';
    }

    // Validasi DWT
    const dwt = Number(formData.capacityDWT);
    if (!formData.capacityDWT) {
      newErrors.capacityDWT = 'Kapasitas DWT (Deadweight Tonnage) wajib diisi';
    } else if (isNaN(dwt) || dwt <= 0) {
      newErrors.capacityDWT = 'Kapasitas DWT harus berupa angka positif lebih dari 0';
    }

    // Validasi Tahun Pembuatan
    const year = Number(formData.yearBuilt);
    const currentYear = new Date().getFullYear();
    if (!formData.yearBuilt) {
      newErrors.yearBuilt = 'Tahun pembuatan wajib diisi';
    } else if (isNaN(year) || year < 1960 || year > currentYear + 2) {
      newErrors.yearBuilt = `Tahun pembuatan harus antara 1960 dan ${currentYear + 2}`;
    }

    // Validasi Nahkoda
    if (!formData.captainName.trim()) {
      newErrors.captainName = 'Nama Nahkoda (Master / Captain) wajib diisi';
    }

    // Validasi Pelabuhan
    if (!formData.currentPort.trim()) {
      newErrors.currentPort = 'Pelabuhan asal / saat ini wajib diisi';
    }
    if (!formData.destinationPort.trim()) {
      newErrors.destinationPort = 'Pelabuhan tujuan wajib diisi';
    }

    // Validasi ETA
    if (!formData.eta) {
      newErrors.eta = 'Estimasi Waktu Tiba (ETA) wajib ditentukan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    if (!validateForm()) return;

    onSubmit({
      name: formData.name.trim(),
      imoNumber: formData.imoNumber.trim(),
      callSign: formData.callSign.trim().toUpperCase(),
      type: formData.type,
      flag: formData.flag.trim() || 'Indonesia',
      capacityDWT: Number(formData.capacityDWT),
      yearBuilt: Number(formData.yearBuilt),
      status: formData.status,
      captainName: formData.captainName.trim(),
      currentPort: formData.currentPort.trim(),
      destinationPort: formData.destinationPort.trim(),
      eta: formData.eta,
      notes: formData.notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <Ship className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {initialData ? 'Ubah Data Kapal Armada' : 'Pendaftaran Kapal Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                Lengkapi spesifikasi teknis dan rute pelayaran kapal
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

        {/* Form Body */}
        <form id="vessel-crud-form" onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Identitas Kapal */}
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-blue-600" />
              1. Identitas & Legalitas Maritim
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kapal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => handleBlur('name')}
                  placeholder="Contoh: KM Japara Bahari IX"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                    touched.name && errors.name
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {touched.name && errors.name && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor IMO (7 Digit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={7}
                  value={formData.imoNumber}
                  onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value.replace(/\D/g, '') })}
                  onBlur={() => handleBlur('imoNumber')}
                  placeholder="Contoh: 9482103"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                    touched.imoNumber && errors.imoNumber
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {touched.imoNumber && errors.imoNumber && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.imoNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Call Sign (Tanda Panggilan) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.callSign}
                  onChange={(e) => setFormData({ ...formData, callSign: e.target.value.toUpperCase() })}
                  onBlur={() => handleBlur('callSign')}
                  placeholder="Contoh: YBDA3"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 uppercase ${
                    touched.callSign && errors.callSign
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {touched.callSign && errors.callSign && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.callSign}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis / Tipe Kapal
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100"
                >
                  {VESSEL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Kapasitas & Teknis */}
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              2. Spesifikasi Teknis & Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kapasitas DWT (Ton) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacityDWT}
                  onChange={(e) => setFormData({ ...formData, capacityDWT: e.target.value })}
                  onBlur={() => handleBlur('capacityDWT')}
                  placeholder="Misal: 18500"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                    touched.capacityDWT && errors.capacityDWT
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {touched.capacityDWT && errors.capacityDWT && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.capacityDWT}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahun Pembuatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                  onBlur={() => handleBlur('yearBuilt')}
                  placeholder="Misal: 2018"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                    touched.yearBuilt && errors.yearBuilt
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {touched.yearBuilt && errors.yearBuilt && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.yearBuilt}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Operasional
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as VesselStatus })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100 font-medium"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Rute, Nahkoda, & ETA */}
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              3. Rute & Penugasan Nahkoda
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nahkoda / Master Kapal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.captainName}
                  onChange={(e) => setFormData({ ...formData, captainName: e.target.value })}
                  onBlur={() => handleBlur('captainName')}
                  placeholder="Contoh: Capt. Hendra Gunawan, M.Mar"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                    touched.captainName && errors.captainName
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {touched.captainName && errors.captainName && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.captainName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pelabuhan Asal / Posisi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.currentPort}
                  onChange={(e) => setFormData({ ...formData, currentPort: e.target.value })}
                  onBlur={() => handleBlur('currentPort')}
                  placeholder="Contoh: Tanjung Priok, Jakarta"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                    touched.currentPort && errors.currentPort
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {touched.currentPort && errors.currentPort && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.currentPort}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pelabuhan Tujuan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.destinationPort}
                  onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
                  onBlur={() => handleBlur('destinationPort')}
                  placeholder="Contoh: Tanjung Perak, Surabaya"
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                    touched.destinationPort && errors.destinationPort
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {touched.destinationPort && errors.destinationPort && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.destinationPort}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimasi Waktu Tiba (ETA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.eta}
                  onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                  onBlur={() => handleBlur('eta')}
                  className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 ${
                    touched.eta && errors.eta
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {touched.eta && errors.eta && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.eta}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan & Kondisi Kapal
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan muatan, kondisi tangki, kebutuhan bahan bakar bunker..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="save-vessel-btn"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan' : 'Daftarkan Kapal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
