const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

// Load .env for local development
try { require('dotenv').config(); } catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;

// ─── UPLOADS DIR (fallback for local dev without Cloudinary) ─
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ─── CRYPTO HELPERS ──────────────────────────────────────────
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// ─── MONGODB CONNECTION ──────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
let _mongoDb = null;

async function connectMongo() {
  if (_mongoDb) return _mongoDb;
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI environment variable is not set.\n' +
      'Please add it in Render → Environment Variables.\n' +
      'Get a free connection string from https://mongodb.com/atlas'
    );
  }
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  _mongoDb = client.db('universalfoundation');
  console.log('✅ Connected to MongoDB Atlas');
  return _mongoDb;
}

// ─── CLOUDINARY SETUP ────────────────────────────────────────
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

function isCloudinaryUrl(url) {
  return url && typeof url === 'string' && url.includes('cloudinary.com');
}

async function deleteImage(imageUrl) {
  if (!imageUrl) return;
  if (isCloudinaryUrl(imageUrl)) {
    // Extract public_id from Cloudinary URL and delete
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    if (match) {
      try { await cloudinary.uploader.destroy(match[1]); } catch (e) { /* ignore */ }
    }
  } else if (imageUrl.startsWith('uploads/')) {
    // Local disk fallback
    const fullPath = path.join(__dirname, imageUrl);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (e) { /* ignore */ }
    }
  }
  // images/* static files are never deleted
}

function getUploadedImagePath(file) {
  if (!file) return null;
  // Cloudinary storage → file.path is the full HTTPS URL
  // Disk storage → build path from filename
  if (hasCloudinary && isCloudinaryUrl(file.path)) return file.path;
  return 'uploads/' + file.filename;
}

// Build multer storage (Cloudinary in prod, disk in local dev)
let uploadStorage;
if (hasCloudinary) {
  uploadStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: 'universal-foundation',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
    })
  });
  console.log('☁️  Cloudinary storage active');
} else {
  uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
  });
  console.log('📁 Local disk storage active (set Cloudinary env vars for production)');
}

const upload = multer({
  storage: uploadStorage,
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|gif/.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Only images (jpg, png, webp, gif) are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ─── DEFAULT SEED DATA ───────────────────────────────────────
const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
const defaultPassword = process.env.ADMIN_PASSWORD || 'UniversalNGO2026!';

async function seedDefaultData(db) {
  const salt = generateSalt();
  const initialData = {
    _id: 'main',
    admin: {
      username: defaultUsername,
      passwordHash: hashPassword(defaultPassword, salt),
      salt
    },
    settings: {
      hero: {
        eyebrow: 'Est. 2000 · Surat, Gujarat',
        title: 'Building a<br><em>Better Tomorrow</em>',
        description: 'Empowering communities through disaster preparedness, environmental action, and life-saving education across India.'
      },
      aboutIntro: {
        label: 'Who We Are',
        title: '25 Years of<br>Meaningful Impact',
        description: 'Established on 15th August 2000, Universal Foundation has worked for over two decades to equip individuals with essential life-saving skills and promote community awareness — from disaster preparedness to environmental sustainability.'
      },
      contact: {
        phone: '+91 83478 07007',
        phoneRaw: '918347807007',
        email: 'hellouniversalfoundation@gmail.com',
        location: 'Surat, Gujarat, India',
        whatsapp: 'https://wa.me/918347807007',
        mapUrl: 'https://www.google.com/maps?q=Universal+Foundation+Surat&output=embed'
      },
      stats: [
        { id: 'stat-lives',  target: '1000', label: 'Lives Impacted' },
        { id: 'stat-events', target: '25',   label: 'Events Held' },
        { id: 'stat-cities', target: '10',   label: 'Cities Reached' },
        { id: 'stat-years',  target: '25',   label: 'Years of Service' }
      ],
      workStats: [
        { id: 'stat-fed',          target: '500',  label: 'Families Fed' },
        { id: 'stat-planted',      target: '1000', label: 'Trees Planted' },
        { id: 'stat-trained',      target: '200',  label: 'Volunteers Trained' },
        { id: 'stat-cities-reached', target: '10', label: 'Cities Reached' }
      ],
      donation: {}
    },
    events: [
      { id: 'event-1', date: '10 June 2026', icon: 'fa-seedling', title: 'Tree Plantation Drive', description: "Join us for a large-scale plantation event across Surat's green zones. All volunteers welcome — tools and saplings provided.", location: 'Surat, Gujarat' },
      { id: 'event-2', date: '20 June 2026', icon: 'fa-heart-pulse', title: 'Health Awareness Camp', description: 'Free health check-ups, first-aid demonstrations, and wellness talks for the community — no registration required.', location: 'Ahmedabad, Gujarat' },
      { id: 'event-3', date: 'July 2026', icon: 'fa-shield-halved', title: 'Disaster Preparedness Workshop', description: 'Hands-on training for flood response, fire safety, and emergency first response. Certificates provided on completion.', location: 'Surat, Gujarat' }
    ],
    internships: [
      { id: 'internship-1', title: 'Applications Open', description: 'Apply for the next CSSI Internship batch or reach out to learn more about how to participate.', status: 'open', batch: 'CSSI Internship - June-July 2026' }
    ],
    gallery: [
      'images/index1of3.jpeg',
      'images/index2of3.jpeg',
      'images/index3of3.jpeg',
      'images/events1.jpeg',
      'images/events2.jpeg',
      'images/events3.jpeg',
      'images/events4.jpeg'
    ],
    blogs: [
      {
        id: 'blog-1', slug: 'empowering-youth-cssi-internship',
        title: 'Empowering Youth: The CSSI 21-Day Internship Journey',
        category: 'Youth Education', date: '27 May 2026',
        summary: 'Discover how the Universal Foundation is training the next generation of social leaders through hands-on emergency drills, cybersecurity training, and environmental action.',
        content: '<p>At Universal Foundation, we believe in bridging the gap between classroom theory and community action. Our flagship 21-day CSSI (Civil Safety &amp; Social Initiative) Internship provides university and high school students with an intensive, immersive experience in social work, disaster preparedness, and community service.</p><h3>Hands-on Emergency Drills</h3><p>Unlike regular internships, CSSI participants don\'t sit behind desks. They participate actively in fire rescue exercises, flood response strategies, and first-aid response drills guided by trained industry professionals. This builds teamwork, resilience, and actionable life-saving capabilities.</p><h3>Cybersecurity &amp; Environmental Drives</h3><p>In addition to safety drills, interns run cybersecurity workshops for senior citizens and lead extensive tree plantation drives across green zones in Surat, Gujarat. Through this diverse curriculum, we empower our youth to become compassionate, informed, and proactive leaders of tomorrow.</p>',
        image: 'images/index1of3.jpeg'
      },
      {
        id: 'blog-2', slug: 'disaster-preparedness-community-resilience',
        title: 'Disaster Preparedness: Why Hands-on Drills Matter',
        category: 'Disaster Management', date: '15 May 2026',
        summary: 'Learning from textbooks versus active flood rescue drills. An insightful guide to building community resilience in Gujarat.',
        content: '<p>When disaster strikes, academic knowledge alone is rarely enough. In a flood, fire, or earthquake, split-second actions determine safety. That is why Universal Foundation has dedicated over two decades to creating realistic, hands-on disaster preparedness workshops for school children and residential communities across Gujarat.</p><h3>Active Muscle Memory</h3><p>During our training sessions, participants learn to handle fire extinguishers, map escape routes under low visibility, and practice survival swimming/rescue techniques. This active simulation creates strong muscle memory, which is essential to prevent panic during real-world crises.</p><h3>Building Strong Neighborhood Networks</h3><p>True community resilience begins at the neighborhood level. By training local youth clubs and resident associations, we ensure that every community has ready, equipped first responders who can act immediately before professional rescue teams arrive. Together, we are building a safer, more resilient India.</p>',
        image: 'images/index3of3.jpeg'
      }
    ],
    impactGallery: [],
    sessions: {}
  };

  await db.collection('config').insertOne(initialData);
  console.log(`
${'='.repeat(54)}
  MONGODB DATABASE INITIALIZED (first run)
  Admin Username : ${defaultUsername}
  Admin Password : ${defaultPassword}
  ⚠  Change this password immediately in the dashboard!
${'='.repeat(54)}
  `);
  return initialData;
}

// ─── CONFIG HELPERS ──────────────────────────────────────────
async function getConfig() {
  const db = await connectMongo();
  let cfg = await db.collection('config').findOne({ _id: 'main' });
  if (!cfg) cfg = await seedDefaultData(db);
  return cfg;
}

async function saveConfig(data) {
  const db = await connectMongo();
  const { _id, ...rest } = data;
  await db.collection('config').replaceOne(
    { _id: 'main' },
    { _id: 'main', ...rest },
    { upsert: true }
  );
}

// ─── SESSION HELPERS ─────────────────────────────────────────
async function getSessions() {
  const cfg = await getConfig();
  return cfg.sessions || {};
}

async function saveSessions(sessions) {
  const db = await connectMongo();
  await db.collection('config').updateOne(
    { _id: 'main' },
    { $set: { sessions } },
    { upsert: true }
  );
}

async function purgeExpiredSessions() {
  const sessions = await getSessions();
  const now = Date.now();
  let changed = false;
  Object.keys(sessions).forEach(id => {
    if (sessions[id].expiry <= now) { delete sessions[id]; changed = true; }
  });
  if (changed) await saveSessions(sessions);
}

// ─── MIDDLEWARES ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads (for dev fallback)
app.use('/uploads', express.static(uploadsDir));

// Cookie parser
function getCookies(req) {
  const cookies = {};
  const header = req.headers.cookie;
  if (header) {
    header.split(';').forEach(c => {
      const parts = c.split('=');
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('='));
      }
    });
  }
  return cookies;
}

// Auth middleware
async function requireAdmin(req, res, next) {
  try {
    const cookies = getCookies(req);
    const sessionId = cookies.admin_session;
    if (sessionId) {
      const sessions = await getSessions();
      const session = sessions[sessionId];
      if (session && session.expiry > Date.now()) {
        req.adminUser = session.username;
        // Slide expiry window
        session.expiry = Date.now() + 2 * 60 * 60 * 1000;
        sessions[sessionId] = session;
        await saveSessions(sessions);
        return next();
      }
      // Expired — clean up
      if (session) {
        const s = await getSessions();
        delete s[sessionId];
        await saveSessions(s);
      }
    }
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session. Please log in again.' });
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed: ' + err.message });
  }
}

// ─── AUTH ROUTES ─────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const cfg = await getConfig();
    if (cfg.admin.username.toLowerCase() === username.toLowerCase()) {
      const candidateHash = hashPassword(password, cfg.admin.salt);
      if (candidateHash === cfg.admin.passwordHash) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const sessionExpiry = Date.now() + 2 * 60 * 60 * 1000;
        await purgeExpiredSessions();
        const sessions = await getSessions();
        sessions[sessionId] = { username: cfg.admin.username, expiry: sessionExpiry };
        await saveSessions(sessions);
        res.setHeader('Set-Cookie', `admin_session=${sessionId}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);
        return res.json({ success: true, message: 'Logged in successfully' });
      }
    }
    res.status(401).json({ error: 'Invalid username or password' });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const cookies = getCookies(req);
    const sessionId = cookies.admin_session;
    if (sessionId) {
      const sessions = await getSessions();
      delete sessions[sessionId];
      await saveSessions(sessions);
    }
    res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed: ' + err.message });
  }
});

app.get('/api/auth/check', async (req, res) => {
  try {
    const cookies = getCookies(req);
    const sessionId = cookies.admin_session;
    if (sessionId) {
      const sessions = await getSessions();
      const session = sessions[sessionId];
      if (session && session.expiry > Date.now()) {
        return res.json({ authenticated: true, username: session.username });
      }
      if (session) {
        delete sessions[sessionId];
        await saveSessions(sessions);
      }
    }
    res.json({ authenticated: false });
  } catch (err) {
    res.json({ authenticated: false });
  }
});

app.post('/api/admin/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    if (!currentPassword || !newUsername || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const cfg = await getConfig();
    const currentHash = hashPassword(currentPassword, cfg.admin.salt);
    if (currentHash !== cfg.admin.passwordHash) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const newSalt = generateSalt();
    cfg.admin.username = newUsername;
    cfg.admin.passwordHash = hashPassword(newPassword, newSalt);
    cfg.admin.salt = newSalt;
    // Invalidate all sessions except the current one
    const cookies = getCookies(req);
    const currentSessionId = cookies.admin_session;
    const sessions = cfg.sessions || {};
    Object.keys(sessions).forEach(key => {
      if (key !== currentSessionId) delete sessions[key];
    });
    cfg.sessions = sessions;
    await saveConfig(cfg);
    res.json({ success: true, message: 'Credentials updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Change password failed: ' + err.message });
  }
});

// ─── PUBLIC API ROUTES ───────────────────────────────────────

app.get('/api/public/settings', async (req, res) => {
  try {
    const cfg = await getConfig();
    res.json(cfg.settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/events', async (req, res) => {
  try {
    const cfg = await getConfig();
    const parseDate = (dStr) => { const d = new Date(dStr); return isNaN(d.getTime()) ? 0 : d.getTime(); };
    const getTs = (id) => { if (typeof id === 'string' && id.startsWith('event-')) { const ts = parseInt(id.split('-')[1]); return isNaN(ts) ? 0 : ts; } return 0; };
    const sorted = [...cfg.events].sort((a, b) => {
      const diff = parseDate(a.date) - parseDate(b.date);
      return diff !== 0 ? diff : getTs(a.id) - getTs(b.id);
    });
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/internships', async (req, res) => {
  try {
    const cfg = await getConfig();
    res.json(cfg.internships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/blogs', async (req, res) => {
  try {
    const cfg = await getConfig();
    const parseDate = (dStr) => { const d = new Date(dStr); return isNaN(d.getTime()) ? 0 : d.getTime(); };
    const getTs = (id) => { if (typeof id === 'string' && id.startsWith('blog-')) { const ts = parseInt(id.split('-')[1]); return isNaN(ts) ? 0 : ts; } return 0; };
    const sorted = [...cfg.blogs].sort((a, b) => {
      const diff = parseDate(b.date) - parseDate(a.date);
      return diff !== 0 ? diff : getTs(b.id) - getTs(a.id);
    });
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/blogs/:idOrSlug', async (req, res) => {
  try {
    const cfg = await getConfig();
    const { idOrSlug } = req.params;
    const post = cfg.blogs.find(b => b.id === idOrSlug || b.slug === idOrSlug);
    if (post) return res.json(post);
    res.status(404).json({ error: 'Blog post not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/gallery', async (req, res) => {
  try {
    const cfg = await getConfig();
    res.json([...cfg.gallery].reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/donation', async (req, res) => {
  try {
    const cfg = await getConfig();
    res.json(cfg.settings.donation || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/public/impact-gallery', async (req, res) => {
  try {
    const cfg = await getConfig();
    res.json(cfg.impactGallery || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ADMIN CRUD ROUTES ───────────────────────────────────────

app.post('/api/admin/settings', requireAdmin, async (req, res) => {
  try {
    const { hero, aboutIntro, contact, stats, workStats } = req.body;
    const cfg = await getConfig();
    if (hero) cfg.settings.hero = hero;
    if (aboutIntro) cfg.settings.aboutIntro = aboutIntro;
    if (contact) cfg.settings.contact = contact;
    if (stats) cfg.settings.stats = stats;
    if (workStats) cfg.settings.workStats = workStats;
    await saveConfig(cfg);
    res.json({ success: true, message: 'Settings saved successfully', settings: cfg.settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Events
app.post('/api/admin/events', requireAdmin, async (req, res) => {
  try {
    const { date, icon, title, description, location } = req.body;
    if (!date || !title || !description) {
      return res.status(400).json({ error: 'Date, Title, and Description are required' });
    }
    const cfg = await getConfig();
    const newEvent = { id: 'event-' + Date.now(), date, icon: icon || 'fa-calendar', title, description, location: location || '' };
    cfg.events.push(newEvent);
    await saveConfig(cfg);
    res.json({ success: true, message: 'Event added successfully', event: newEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { date, icon, title, description, location } = req.body;
    const cfg = await getConfig();
    const idx = cfg.events.findIndex(e => e.id === eventId);
    if (idx === -1) return res.status(404).json({ error: 'Event not found' });
    cfg.events[idx] = {
      ...cfg.events[idx],
      date: date || cfg.events[idx].date,
      icon: icon || cfg.events[idx].icon,
      title: title || cfg.events[idx].title,
      description: description || cfg.events[idx].description,
      location: location !== undefined ? location : cfg.events[idx].location
    };
    await saveConfig(cfg);
    res.json({ success: true, message: 'Event updated successfully', event: cfg.events[idx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/events/:id', requireAdmin, async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const cfg = await getConfig();
    const before = cfg.events.length;
    cfg.events = cfg.events.filter(e => e.id !== eventId);
    if (cfg.events.length === before) return res.status(404).json({ error: 'Event not found' });
    await saveConfig(cfg);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Internships
app.post('/api/admin/internships', requireAdmin, async (req, res) => {
  try {
    const { id, title, description, status, batch } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and Description are required' });
    const cfg = await getConfig();
    const targetId = id || 'internship-1';
    const idx = cfg.internships.findIndex(i => i.id === targetId);
    const data = { id: targetId, title, description, status: status || 'open', batch: batch || '' };
    if (idx !== -1) cfg.internships[idx] = data;
    else cfg.internships.push(data);
    await saveConfig(cfg);
    res.json({ success: true, message: 'Internship schedule updated successfully', internship: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Blogs
app.post('/api/admin/blogs', requireAdmin, upload.single('coverImage'), async (req, res) => {
  try {
    const { title, category, date, summary, content } = req.body;
    if (!title || !summary || !content) {
      if (req.file) await deleteImage(getUploadedImagePath(req.file));
      return res.status(400).json({ error: 'Title, Summary, and Content are required' });
    }
    const imagePath = req.file ? getUploadedImagePath(req.file) : 'images/index1of3.jpeg';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const cfg = await getConfig();
    const newPost = {
      id: 'blog-' + Date.now(), slug, title,
      category: category || 'NGO Activities',
      date: date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      summary, content, image: imagePath
    };
    cfg.blogs.push(newPost);
    await saveConfig(cfg);
    res.json({ success: true, message: 'Blog post created successfully', blog: newPost });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blog: ' + err.message });
  }
});

app.put('/api/admin/blogs/:id', requireAdmin, upload.single('coverImage'), async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const { title, category, date, summary, content } = req.body;
    const cfg = await getConfig();
    const idx = cfg.blogs.findIndex(b => b.id === blogId);
    if (idx === -1) {
      if (req.file) await deleteImage(getUploadedImagePath(req.file));
      return res.status(404).json({ error: 'Blog post not found' });
    }
    const post = cfg.blogs[idx];
    let imagePath = post.image;
    if (req.file) {
      await deleteImage(post.image);
      imagePath = getUploadedImagePath(req.file);
    }
    const newSlug = title
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : post.slug;
    cfg.blogs[idx] = {
      ...post, slug: newSlug,
      title: title || post.title,
      category: category || post.category,
      date: date || post.date,
      summary: summary || post.summary,
      content: content || post.content,
      image: imagePath
    };
    await saveConfig(cfg);
    res.json({ success: true, message: 'Blog post updated successfully', blog: cfg.blogs[idx] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update blog: ' + err.message });
  }
});

app.delete('/api/admin/blogs/:id', requireAdmin, async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const cfg = await getConfig();
    const post = cfg.blogs.find(b => b.id === blogId);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    await deleteImage(post.image);
    cfg.blogs = cfg.blogs.filter(b => b.id !== blogId);
    await saveConfig(cfg);
    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gallery
app.post('/api/admin/gallery', requireAdmin, upload.single('galleryImage'), async (req, res) => {
  try {
    const cfg = await getConfig();
    if (cfg.gallery && cfg.gallery.length >= 9) {
      if (req.file) await deleteImage(getUploadedImagePath(req.file));
      return res.status(400).json({ error: 'Maximum 9 images allowed. Please delete an existing image before uploading a new one.' });
    }
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded' });
    const imagePath = getUploadedImagePath(req.file);
    cfg.gallery.push(imagePath);
    await saveConfig(cfg);
    res.json({ success: true, message: 'Image uploaded to gallery successfully', image: imagePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/gallery', requireAdmin, async (req, res) => {
  try {
    const { imagePath } = req.body;
    if (!imagePath) return res.status(400).json({ error: 'Image path is required' });
    const cfg = await getConfig();
    const before = cfg.gallery.length;
    cfg.gallery = cfg.gallery.filter(img => img !== imagePath);
    if (cfg.gallery.length === before) return res.status(404).json({ error: 'Image not found in gallery database' });
    await deleteImage(imagePath);
    await saveConfig(cfg);
    res.json({ success: true, message: 'Image deleted from gallery successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Donation
app.post('/api/admin/donation', requireAdmin, upload.single('qrImage'), async (req, res) => {
  try {
    const { message, upiId } = req.body;
    const cfg = await getConfig();
    if (!cfg.settings.donation) cfg.settings.donation = {};
    if (message) cfg.settings.donation.message = message;
    if (upiId) cfg.settings.donation.upiId = upiId;
    if (req.file) {
      await deleteImage(cfg.settings.donation.qrImage);
      cfg.settings.donation.qrImage = getUploadedImagePath(req.file);
    }
    await saveConfig(cfg);
    res.json({ success: true, message: 'Donation settings updated', donation: cfg.settings.donation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Impact Gallery
app.post('/api/admin/impact-gallery', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const { id, year, title, description, eventDate } = req.body;
    if (!year || !title) return res.status(400).json({ error: 'Year and Title are required' });
    const cfg = await getConfig();
    if (!cfg.impactGallery) cfg.impactGallery = [];
    const imagePaths = req.files ? req.files.map(f => getUploadedImagePath(f)) : [];
    if (id) {
      const idx = cfg.impactGallery.findIndex(i => i.id === id);
      if (idx !== -1) {
        cfg.impactGallery[idx] = {
          ...cfg.impactGallery[idx], year, title,
          description: description || '', eventDate: eventDate || ''
        };
        if (imagePaths.length > 0) {
          cfg.impactGallery[idx].images = [...cfg.impactGallery[idx].images, ...imagePaths];
        }
        await saveConfig(cfg);
        return res.json({ success: true, message: 'Impact gallery event updated', event: cfg.impactGallery[idx] });
      }
    }
    const newEvent = { id: 'ig-' + Date.now(), year, title, description: description || '', eventDate: eventDate || '', images: imagePaths };
    cfg.impactGallery.push(newEvent);
    await saveConfig(cfg);
    res.json({ success: true, message: 'Impact gallery event created', event: newEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/impact-gallery/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const cfg = await getConfig();
    if (!cfg.impactGallery) return res.status(404).json({ error: 'Not found' });
    const idx = cfg.impactGallery.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    for (const imgPath of cfg.impactGallery[idx].images) await deleteImage(imgPath);
    cfg.impactGallery.splice(idx, 1);
    await saveConfig(cfg);
    res.json({ success: true, message: 'Impact gallery event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/impact-gallery/:id/image', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { imagePath } = req.body;
    const cfg = await getConfig();
    const idx = cfg.impactGallery.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const imgIdx = cfg.impactGallery[idx].images.indexOf(imagePath);
    if (imgIdx === -1) return res.status(404).json({ error: 'Image not found in event' });
    cfg.impactGallery[idx].images.splice(imgIdx, 1);
    await deleteImage(imagePath);
    await saveConfig(cfg);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEO: SITEMAP & ROBOTS ───────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = 'https://www.universalfoundationindia.com';
  const today = new Date().toISOString().split('T')[0];
  const pages = [
    { url: '/',             changefreq: 'weekly',  priority: '1.0' },
    { url: '/about.html',   changefreq: 'monthly', priority: '0.8' },
    { url: '/events.html',  changefreq: 'weekly',  priority: '0.9' },
    { url: '/work.html',    changefreq: 'monthly', priority: '0.7' },
    { url: '/blog.html',    changefreq: 'weekly',  priority: '0.8' },
    { url: '/donate.html',  changefreq: 'monthly', priority: '0.8' },
    { url: '/contact.html', changefreq: 'monthly', priority: '0.7' }
  ];
  const urlEntries = pages.map(p =>
    `\n  <url>\n    <loc>${baseUrl}${p.url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
  ).join('');
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}\n</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(
    `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\n` +
    `Sitemap: https://www.universalfoundationindia.com/sitemap.xml`
  );
});

// ─── FAVICON ROUTES ──────────────────────────────────────────
const faviconFiles = {
  '/favicon.ico':          'favicon.ico',
  '/favicon-32x32.png':   'favicon-32x32.png',
  '/favicon-16x16.png':   'favicon-16x16.png',
  '/apple-touch-icon.png': 'apple-touch-icon.png',
  '/favicon-192x192.png': 'favicon-192x192.png'
};
Object.entries(faviconFiles).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    const ext = path.extname(file).toLowerCase();
    res.setHeader('Content-Type', ext === '.ico' ? 'image/x-icon' : 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(path.join(__dirname, file));
  });
});

// ─── STATIC FILES & CATCH-ALL ────────────────────────────────
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ─── START SERVER ─────────────────────────────────────────────
async function startServer() {
  try {
    await connectMongo();
    app.listen(PORT, () => {
      console.log(`🚀 Universal Foundation CMS running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
