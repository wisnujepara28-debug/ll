import React, { useState, useEffect } from 'react';
import { ShipmentCargo, CargoType, Vessel } from '../types';
import { X, Package, AlertCircle, Check } from 'lucide-react';

interface CargoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cargoData: Omit<ShipmentCargo, 'id' | 'updatedAt'>) => void;
  initialData?: ShipmentCargo | null;
  vessels: Vessel[];
}

const CARGO_TYPES: CargoType[] = [
  'Kontainer',
  'Curah Kering',
  'Curah Cair',
  'General Cargo',
  'Kendaraan (Ro-Ro)',
];

const CARGO_STATUSES = [
  'Manifest',
  'Dimuat',
  'Dalam Perjalanan',
  'Tiba di Pelabuhan',
  'Selesai Dibongkar',
] as const;

export const CargoModal: React.FC<CargoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  vessels,
}) => {
  const [formData, setFormData] = useState({
    trackingNumber: '',
    vesselId: vessels[0]?.id || '',
    shipper: '',
    consignee: '',
    cargoType: CARGO_TYPES[0],
    weightTons: '',
    originPort: '',
    destinationPort: '',
    status: 'Manifest' as ShipmentCargo['status'],
    sealNumber: '',
    containerNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        trackingNumber: initialData.trackingNumber,
        vesselId: initialData.vesselId,
        shipper: initialData.shipper,
        consignee: initialData.consignee,
        cargoType: initialData.cargoType,
        weightTons: initialData.weightTons.toString(),
        originPort: initialData.originPort,
        destinationPort: initialData.destinationPort,
        status: initialData.status,
        sealNumber: initialData.sealNumber || '',
        containerNumber: initialData.containerNumber || '',
      });
    } else {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        trackingNumber: `TRK-2026-${randomCode}`,
        vesselId: vessels[0]?.id || '',
        shipper: '',
        consignee: '',
        cargoType: CARGO_TYPES[0],
        weightTons: '',
        originPort: '',
        destinationPort: '',
        status: 'Manifest',
        sealNumber: `SEAL-${randomCode}`,
        containerNumber: '',
      });
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen, vessels]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.trackingNumber.trim()) {
      errs.trackingNumber = 'Nomor pelacakan / B/L wajib diisi';
    }

    if (!formData.vesselId) {
      errs.vesselId = 'Pilih kapal pengangkut';
    }

    if (!formData.shipper.trim()) {
      errs.shipper = 'Nama perusahaan pengirim (Shipper) wajib diisi';
    }

    if (!formData.consignee.trim()) {
      errs.consignee = 'Nama perusahaan penerima (Consignee) wajib diisi';
    }

    const weight = Number(formData.weightTons);
    if (!formData.weightTons) {
      errs.weightTons = 'Berat muatan wajib diisi';
    } else if (isNaN(weight) || weight <= 0) {
      errs.weightTons = 'Berat harus berupa angka positif';
    }

    if (!formData.originPort.trim()) {
      errs.originPort = 'Pelabuhan muat (Port of Loading) wajib diisi';
    }

    if (!formData.destinationPort.trim()) {
      errs.destinationPort = 'Pelabuhan bongkar (Port of Discharge) wajib diisi';
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

    const selectedVessel = vessels.find((v) => v.id === formData.vesselId);

    onSubmit({
      trackingNumber: formData.trackingNumber.trim().toUpperCase(),
      vesselId: formData.vesselId,
      vesselName: selectedVessel ? selectedVessel.name : 'Unknown Vessel',
      shipper: formData.shipper.trim(),
      consignee: formData.consignee.trim(),
      cargoType: formData.cargoType,
      weightTons: Number(formData.weightTons),
      originPort: formData.originPort.trim(),
      destinationPort: formData.destinationPort.trim(),
      status: formData.status,
      sealNumber: formData.sealNumber.trim(),
      containerNumber: formData.containerNumber.trim().toUpperCase(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {initialData ? 'Ubah Data Manifest Muatan' : 'Pencatatan Muatan Kargo Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                Bill of Lading, informasi shipper, consignee, dan status kiriman
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. B/L / Tracking <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white uppercase font-mono"
              />
              {touched.trackingNumber && errors.trackingNumber && (
                <p className="text-[11px] text-red-600 mt-1">{errors.trackingNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kapal Pengangkut <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vesselId}
                onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                {vessels.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pengirim (Shipper) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="PT Indofood Tbk"
                value={formData.shipper}
                onChange={(e) => setFormData({ ...formData, shipper: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
              {touched.shipper && errors.shipper && (
                <p className="text-[11px] text-red-600 mt-1">{errors.shipper}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Penerima (Consignee) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="PT Sumber Logistik"
                value={formData.consignee}
                onChange={(e) => setFormData({ ...formData, consignee: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
              {touched.consignee && errors.consignee && (
                <p className="text-[11px] text-red-600 mt-1">{errors.consignee}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Komoditas / Kargo
              </label>
              <select
                value={formData.cargoType}
                onChange={(e) => setFormData({ ...formData, cargoType: e.target.value as CargoType })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                {CARGO_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tonase / Berat (Ton) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Contoh: 1500"
                value={formData.weightTons}
                onChange={(e) => setFormData({ ...formData, weightTons: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
              {touched.weightTons && errors.weightTons && (
                <p className="text-[11px] text-red-600 mt-1">{errors.weightTons}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pelabuhan Muat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Tanjung Priok"
                value={formData.originPort}
                onChange={(e) => setFormData({ ...formData, originPort: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
              {touched.originPort && errors.originPort && (
                <p className="text-[11px] text-red-600 mt-1">{errors.originPort}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pelabuhan Tujuan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Tanjung Perak"
                value={formData.destinationPort}
                onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
              {touched.destinationPort && errors.destinationPort && (
                <p className="text-[11px] text-red-600 mt-1">{errors.destinationPort}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Kontainer / Ruang Muat
              </label>
              <input
                type="text"
                placeholder="IDNU-482910-2"
                value={formData.containerNumber}
                onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Segel (Seal Number)
              </label>
              <input
                type="text"
                placeholder="SEAL-JKT-99201"
                value={formData.sealNumber}
                onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Kargo
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ShipmentCargo['status'] })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-medium"
              >
                {CARGO_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
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
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Simpan Manifest' : 'Daftarkan Kargo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
