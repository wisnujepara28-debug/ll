export type VesselStatus = 'Berlayar' | 'Bersandar' | 'Docking' | 'Menunggu Instruksi';
export type CargoType = 'Kontainer' | 'Curah Kering' | 'Curah Cair' | 'General Cargo' | 'Kendaraan (Ro-Ro)';

export interface Vessel {
  id: string;
  name: string; // Nama Kapal
  imoNumber: string; // Nomor IMO (7 digit)
  callSign: string; // Tanda Panggilan
  type: string; // Jenis Kapal (misal: Container Carrier, Bulk Carrier, Oil Tanker)
  flag: string; // Bendera / Negara Registrasi (misal: Indonesia)
  capacityDWT: number; // Kapasitas DWT (Deadweight Tonnage)
  yearBuilt: number; // Tahun Pembuatan
  status: VesselStatus; // Status Operasional
  captainName: string; // Nama Nahkoda
  currentPort: string; // Pelabuhan Saat Ini / Asal
  destinationPort: string; // Pelabuhan Tujuan
  eta: string; // Estimasi Waktu Tiba (YYYY-MM-DDTHH:mm)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentCargo {
  id: string;
  trackingNumber: string;
  vesselId: string;
  vesselName: string;
  shipper: string; // Pengirim
  consignee: string; // Penerima
  cargoType: CargoType;
  weightTons: number;
  originPort: string;
  destinationPort: string;
  status: 'Manifest' | 'Dimuat' | 'Dalam Perjalanan' | 'Tiba di Pelabuhan' | 'Selesai Dibongkar';
  sealNumber?: string;
  containerNumber?: string;
  updatedAt: string;
}

export interface CrewMember {
  id: string;
  vesselId: string;
  vesselName: string;
  fullName: string;
  rank: string; // Jabatan (Master, Chief Engineer, Chief Officer, Bosun, dll)
  seamanBookNumber: string; // Buku Pelaut
  nationality: string;
  contractExpiry: string;
  phone: string;
  status: 'Aktif di Kapal' | 'Cuti' | 'Siaga';
}

export interface UserSession {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
}

export interface OnlineUser {
  id: string;
  name: string;
  username: string;
  role: string;
}
