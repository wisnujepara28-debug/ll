import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Inisialisasi Database Default Japara Bahari Shipping
const INITIAL_VESSELS = [
  {
    id: 'VES-001',
    name: 'KM Japara Bahari Raya',
    imoNumber: '9482103',
    callSign: 'YBDA3',
    type: 'Container Carrier (Petikemas)',
    flag: 'Indonesia',
    capacityDWT: 18500,
    yearBuilt: 2019,
    status: 'Berlayar',
    captainName: 'Capt. Hendra Gunawan, M.Mar',
    currentPort: 'Pelabuhan Tanjung Emas, Semarang',
    destinationPort: 'Pelabuhan Karimunjawa, Jepara',
    eta: '2026-09-20T14:30',
    notes: 'Rute reguler logistik pesisir utara Jawa & Kepulauan Jepara.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'VES-002',
    name: 'MV Samudera Pasifik 8',
    imoNumber: '9621094',
    callSign: 'POW21',
    type: 'Bulk Carrier (Curah Kering)',
    flag: 'Indonesia',
    capacityDWT: 45000,
    yearBuilt: 2016,
    status: 'Bersandar',
    captainName: 'Capt. Bambang Suryadi',
    currentPort: 'Pelabuhan Belawan, Medan',
    destinationPort: 'Makassar New Port',
    eta: '2026-09-25T09:00',
    notes: 'Proses pemuatan semen curah dan komoditas.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'VES-003',
    name: 'MT Japara Petro Marine',
    imoNumber: '9738120',
    callSign: 'YBL88',
    type: 'Oil & Chemical Tanker (Tangker)',
    flag: 'Indonesia',
    capacityDWT: 22000,
    yearBuilt: 2021,
    status: 'Berlayar',
    captainName: 'Capt. Firman Ardiansyah',
    currentPort: 'Balikpapan (Kilang Minyak)',
    destinationPort: 'Tanjung Wangi, Banyuwangi',
    eta: '2026-09-22T06:00',
    notes: 'Muatan BBM Industri & biosolar.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'VES-004',
    name: 'KMP Kartini Express Japara',
    imoNumber: '9218944',
    callSign: 'PKST4',
    type: 'Kendaraan & Penumpang (Ro-Ro)',
    flag: 'Indonesia',
    capacityDWT: 8500,
    yearBuilt: 2018,
    status: 'Bersandar',
    captainName: 'Capt. Agus Supriyadi',
    currentPort: 'Dermaga Kartini, Jepara',
    destinationPort: 'Pelabuhan Karimunjawa',
    eta: '2026-09-21T08:00',
    notes: 'Kapal cepat Ro-Ro melayani penumpang & kendaraan logistik.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_CARGOS = [
  {
    id: 'CRG-8821',
    trackingNumber: 'TRK-JPR-001',
    vesselId: 'VES-001',
    vesselName: 'KM Japara Bahari Raya',
    shipper: 'PT Ukir Kayu Jepara Mandiri',
    consignee: 'PT Samudera Logistik Internasional',
    cargoType: 'Kontainer',
    weightTons: 1450,
    originPort: 'Pelabuhan Tanjung Emas, Semarang',
    destinationPort: 'Pelabuhan Karimunjawa, Jepara',
    status: 'Dalam Perjalanan',
    sealNumber: 'SEAL-JPR-99201',
    containerNumber: 'JPRU-482910-2',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CRG-8822',
    trackingNumber: 'TRK-JPR-002',
    vesselId: 'VES-004',
    vesselName: 'KMP Kartini Express Japara',
    shipper: 'Koperasi Nelayan Bahari Jepara',
    consignee: 'Distributor Pangan Karimunjawa',
    cargoType: 'General Cargo',
    weightTons: 350,
    originPort: 'Dermaga Kartini, Jepara',
    destinationPort: 'Pelabuhan Karimunjawa',
    status: 'Dimuat',
    sealNumber: 'SEAL-EXP-401',
    containerNumber: 'RO-RO-PALLET-01',
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_CREWS = [
  {
    id: 'CRW-101',
    vesselId: 'VES-001',
    vesselName: 'KM Japara Bahari Raya',
    fullName: 'Capt. Hendra Gunawan, M.Mar',
    rank: 'Nakhoda / Master',
    seamanBookNumber: 'B.049210-IDN',
    nationality: 'Indonesia',
    contractExpiry: '2027-04-15',
    phone: '+62 811-2345-6781',
    status: 'Aktif di Kapal',
  },
  {
    id: 'CRW-102',
    vesselId: 'VES-001',
    vesselName: 'KM Japara Bahari Raya',
    fullName: 'Ir. Dedi Kurniawan, ATT-I',
    rank: 'Kepala Kamar Mesin (Chief Engineer)',
    seamanBookNumber: 'B.083719-IDN',
    nationality: 'Indonesia',
    contractExpiry: '2027-01-30',
    phone: '+62 812-9876-5432',
    status: 'Aktif di Kapal',
  },
  {
    id: 'CRW-103',
    vesselId: 'VES-004',
    vesselName: 'KMP Kartini Express Japara',
    fullName: 'Capt. Agus Supriyadi, ANT-II',
    rank: 'Nakhoda / Master',
    seamanBookNumber: 'B.033190-IDN',
    nationality: 'Indonesia',
    contractExpiry: '2027-06-20',
    phone: '+62 813-4455-6677',
    status: 'Aktif di Kapal',
  }
];

// Persistent File Storage on Server
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'shipping_db.json');

interface DbSchema {
  vessels: typeof INITIAL_VESSELS;
  cargos: typeof INITIAL_CARGOS;
  crews: typeof INITIAL_CREWS;
  lastUpdated: string;
}

function loadDatabase(): DbSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading database file:', err);
  }

  const initialDb: DbSchema = {
    vessels: INITIAL_VESSELS,
    cargos: INITIAL_CARGOS,
    crews: INITIAL_CREWS,
    lastUpdated: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  } catch (e) {
    console.error('Error writing initial db:', e);
  }
  return initialDb;
}

let db = loadDatabase();

function saveDatabase() {
  try {
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to persist db to disk:', err);
  }
}

// Active Online Users Tracker
interface OnlineUser {
  id: string;
  name: string;
  username: string;
  role: string;
  lastActive: number;
}
const onlineUsersMap = new Map<string, OnlineUser>();

// Bersihkan user tidak aktif setiap 15 detik (> 30 detik tanpa ping)
setInterval(() => {
  const now = Date.now();
  for (const [id, user] of onlineUsersMap.entries()) {
    if (now - user.lastActive > 30000) {
      onlineUsersMap.delete(id);
    }
  }
}, 15000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === API ROUTES ===

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      system: 'JAPARA BAHARI SHIPPING REALTIME SERVER',
      onlineUsersCount: onlineUsersMap.size,
      time: new Date().toISOString(),
    });
  });

  // Get all data & online status
  app.get('/api/data', (_req, res) => {
    res.json({
      vessels: db.vessels,
      cargos: db.cargos,
      crews: db.crews,
      lastUpdated: db.lastUpdated,
      onlineUsers: Array.from(onlineUsersMap.values()),
    });
  });

  // User Heartbeat Ping (Untuk sistem online multi-pengguna)
  app.post('/api/online/ping', (req, res) => {
    const { id, name, username, role } = req.body;
    if (id && name) {
      onlineUsersMap.set(id, {
        id,
        name,
        username: username || name,
        role: role || 'Staff Operasional',
        lastActive: Date.now(),
      });
    }

    const activeList = Array.from(onlineUsersMap.values()).map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
    }));

    res.json({
      success: true,
      onlineCount: activeList.length,
      users: activeList,
    });
  });

  // User Logout notification
  app.post('/api/online/leave', (req, res) => {
    const { id } = req.body;
    if (id) {
      onlineUsersMap.delete(id);
    }
    res.json({ success: true });
  });

  // --- CRUD VESSELS ---
  app.post('/api/vessels', (req, res) => {
    const newVessel = {
      ...req.body,
      id: req.body.id || `VES-${String(db.vessels.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.vessels.unshift(newVessel);
    saveDatabase();
    res.status(201).json(newVessel);
  });

  app.put('/api/vessels/:id', (req, res) => {
    const { id } = req.params;
    const index = db.vessels.findIndex((v) => v.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Kapal tidak ditemukan' });
    }
    db.vessels[index] = {
      ...db.vessels[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase();
    res.json(db.vessels[index]);
  });

  app.delete('/api/vessels/:id', (req, res) => {
    const { id } = req.params;
    db.vessels = db.vessels.filter((v) => v.id !== id);
    saveDatabase();
    res.json({ success: true, deletedId: id });
  });

  // --- CRUD CARGOS ---
  app.post('/api/cargos', (req, res) => {
    const newCargo = {
      ...req.body,
      id: req.body.id || `CRG-${Math.floor(1000 + Math.random() * 9000)}`,
      updatedAt: new Date().toISOString(),
    };
    db.cargos.unshift(newCargo);
    saveDatabase();
    res.status(201).json(newCargo);
  });

  app.put('/api/cargos/:id', (req, res) => {
    const { id } = req.params;
    const index = db.cargos.findIndex((c) => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Muatan tidak ditemukan' });
    }
    db.cargos[index] = {
      ...db.cargos[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase();
    res.json(db.cargos[index]);
  });

  app.delete('/api/cargos/:id', (req, res) => {
    const { id } = req.params;
    db.cargos = db.cargos.filter((c) => c.id !== id);
    saveDatabase();
    res.json({ success: true, deletedId: id });
  });

  // --- CRUD CREWS ---
  app.post('/api/crews', (req, res) => {
    const newCrew = {
      ...req.body,
      id: req.body.id || `CRW-${Math.floor(100 + Math.random() * 900)}`,
    };
    db.crews.unshift(newCrew);
    saveDatabase();
    res.status(201).json(newCrew);
  });

  app.put('/api/crews/:id', (req, res) => {
    const { id } = req.params;
    const index = db.crews.findIndex((cr) => cr.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Awak kapal tidak ditemukan' });
    }
    db.crews[index] = {
      ...db.crews[index],
      ...req.body,
    };
    saveDatabase();
    res.json(db.crews[index]);
  });

  app.delete('/api/crews/:id', (req, res) => {
    const { id } = req.params;
    db.crews = db.crews.filter((cr) => cr.id !== id);
    saveDatabase();
    res.json({ success: true, deletedId: id });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Japara Bahari Shipping server online on port ${PORT}`);
  });
}

startServer();
