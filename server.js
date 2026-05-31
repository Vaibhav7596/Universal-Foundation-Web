const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── INITIALIZE DIRECTORIES ─────────────────────────────────
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
const dbPath = path.join(dataDir, 'db.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ─── CRYPTO SECURE HASHING ──────────────────────────────────
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// ─── SEED DEFAULT DATABASE ──────────────────────────────────
const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
const defaultPassword = process.env.ADMIN_PASSWORD || 'UniversalNGO2026!';

if (!fs.existsSync(dbPath)) {
  const salt = generateSalt();
  const passwordHash = hashPassword(defaultPassword, salt);

  const initialData = {
    admin: {
      username: defaultUsername,
      passwordHash: passwordHash,
      salt: salt
    },
    settings: {
      hero: {
        eyebrow: "Est. 2000 · Surat, Gujarat",
        title: "Building a<br><em>Better Tomorrow</em>",
        description: "Empowering communities through disaster preparedness, environmental action, and life-saving education across India."
      },
      aboutIntro: {
        label: "Who We Are",
        title: "25 Years of<br>Meaningful Impact",
        description: "Established on 15th August 2000, Universal Foundation has worked for over two decades to equip individuals with essential life-saving skills and promote community awareness — from disaster preparedness to environmental sustainability."
      },
      contact: {
        phone: "+91 83478 07007",
        phoneRaw: "918347807007",
        email: "hellouniversalfoundation@gmail.com",
        location: "Surat, Gujarat, India",
        whatsapp: "https://wa.me/918347807007",
        mapUrl: "https://www.google.com/maps?q=Universal+Foundation+Surat&output=embed"
      },
      stats: [
        { "id": "stat-lives", "target": "1000", "label": "Lives Impacted" },
        { "id": "stat-events", "target": "25", "label": "Events Held" },
        { "id": "stat-cities", "target": "10", "label": "Cities Reached" },
        { "id": "stat-years", "target": "25", "label": "Years of Service" }
      ],
      workStats: [
        { "id": "stat-fed", "target": "500", "label": "Families Fed" },
        { "id": "stat-planted", "target": "1000", "label": "Trees Planted" },
        { "id": "stat-trained", "target": "200", "label": "Volunteers Trained" },
        { "id": "stat-cities-reached", "target": "10", "label": "Cities Reached" }
      ]
    },
    events: [
      {
        "id": "event-1",
        "date": "10 June 2026",
        "icon": "fa-seedling",
        "title": "Tree Plantation Drive",
        "description": "Join us for a large-scale plantation event across Surat's green zones. All volunteers welcome — tools and saplings provided.",
        "location": "Surat, Gujarat"
      },
      {
        "id": "event-2",
        "date": "20 June 2026",
        "icon": "fa-heart-pulse",
        "title": "Health Awareness Camp",
        "description": "Free health check-ups, first-aid demonstrations, and wellness talks for the community — no registration required.",
        "location": "Ahmedabad, Gujarat"
      },
      {
        "id": "event-3",
        "date": "July 2026",
        "icon": "fa-shield-halved",
        "title": "Disaster Preparedness Workshop",
        "description": "Hands-on training for flood response, fire safety, and emergency first response. Certificates provided on completion.",
        "location": "Surat, Gujarat"
      }
    ],
    internships: [
      {
        "id": "internship-1",
        "title": "Applications Open",
        "description": "Apply for the next CSSI Internship batch or reach out to learn more about how to participate.",
        "status": "open",
        "batch": "CSSI Internship - June-July 2026"
      }
    ],
    gallery: [
      "images/index1of3.jpeg",
      "images/index2of3.jpeg",
      "images/index3of3.jpeg",
      "images/events1.jpeg",
      "images/events2.jpeg",
      "images/events3.jpeg",
      "images/events4.jpeg"
    ],
    blogs: [
      {
        "id": "blog-1",
        "slug": "empowering-youth-cssi-internship",
        "title": "Empowering Youth: The CSSI 21-Day Internship Journey",
        "category": "Youth Education",
        "date": "27 May 2026",
        "summary": "Discover how the Universal Foundation is training the next generation of social leaders through hands-on emergency drills, cybersecurity training, and environmental action.",
        "content": "<p>At Universal Foundation, we believe in bridging the gap between classroom theory and community action. Our flagship 21-day CSSI (Civil Safety & Social Initiative) Internship provides university and high school students with an intensive, immersive experience in social work, disaster preparedness, and community service.</p><h3>Hands-on Emergency Drills</h3><p>Unlike regular internships, CSSI participants don't sit behind desks. They participate actively in fire rescue exercises, flood response strategies, and first-aid response drills guided by trained industry professionals. This builds teamwork, resilience, and actionable life-saving capabilities.</p><h3>Cybersecurity & Environmental Drives</h3><p>In addition to safety drills, interns run cybersecurity workshops for senior citizens and lead extensive tree plantation drives across green zones in Surat, Gujarat. Through this diverse curriculum, we empower our youth to become compassionate, informed, and proactive leaders of tomorrow.</p>",
        "image": "images/index1of3.jpeg"
      },
      {
        "id": "blog-2",
        "slug": "disaster-preparedness-community-resilience",
        "title": "Disaster Preparedness: Why Hands-on Drills Matter",
        "category": "Disaster Management",
        "date": "15 May 2026",
        "summary": "Learning from textbooks versus active flood rescue drills. An insightful guide to building community resilience in Gujarat.",
        "content": "<p>When disaster strikes, academic knowledge alone is rarely enough. In a flood, fire, or earthquake, split-second actions determine safety. That is why Universal Foundation has dedicated over two decades to creating realistic, hands-on disaster preparedness workshops for school children and residential communities across Gujarat.</p><h3>Active Muscle Memory</h3><p>During our training sessions, participants learn to handle fire extinguishers, map escape routes under low visibility, and practice survival swimming/rescue techniques. This active simulation creates strong muscle memory, which is essential to prevent panic during real-world crises.</p><h3>Building Strong Neighborhood Networks</h3><p>True community resilience begins at the neighborhood level. By training local youth clubs and resident associations, we ensure that every community has ready, equipped first responders who can act immediately before professional rescue teams arrive. Together, we are building a safer, more resilient India.</p>",
        "image": "images/index3of3.jpeg"
      }
    ]
  };

  fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  console.log(`
==================================================
CMS DATABASE INITIALIZED
Admin Username: ${defaultUsername}
Admin Password: ${defaultPassword}
(Please change this password immediately in the dashboard!)
==================================================
  `);
}

// Helper to read DB
function readDb() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Helper to write DB
function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// ─── MIDDLEWARES ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Cookie Parser Middleware (custom 5-line implementation)
function getCookies(req) {
  const cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(c => {
      const parts = c.split('=');
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('='));
      }
    });
  }
  return cookies;
}

// Active Sessions Storage (in-memory)
const activeSessions = new Map();

// Authentication Verification Middleware
function requireAdmin(req, res, next) {
  const cookies = getCookies(req);
  const sessionId = cookies.admin_session;
  
  if (sessionId && activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    if (session.expiry > Date.now()) {
      req.adminUser = session.username;
      // Refresh expiry to 2 hours of inactivity
      session.expiry = Date.now() + 2 * 60 * 60 * 1000;
      return next();
    } else {
      activeSessions.delete(sessionId);
    }
  }
  
  res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
}

// ─── FILE UPLOAD STORAGE CONFIGURATION ──────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, png, webp, gif) are allowed!'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ─── AUTHENTICATION ROUTES ──────────────────────────────────

// Admin Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const db = readDb();
  if (db.admin.username.toLowerCase() === username.toLowerCase()) {
    const candidateHash = hashPassword(password, db.admin.salt);
    if (candidateHash === db.admin.passwordHash) {
      // Generate safe session token
      const sessionId = crypto.randomBytes(32).toString('hex');
      const sessionExpiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hours

      activeSessions.set(sessionId, {
        username: db.admin.username,
        expiry: sessionExpiry
      });

      // Set cookie header
      res.setHeader('Set-Cookie', `admin_session=${sessionId}; HttpOnly; Path=/; SameSite=Strict; Max-Age=7200`);
      return res.json({ success: true, message: 'Logged in successfully' });
    }
  }

  res.status(401).json({ error: 'Invalid username or password' });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const cookies = getCookies(req);
  const sessionId = cookies.admin_session;
  
  if (sessionId) {
    activeSessions.delete(sessionId);
  }
  
  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Check Session Authentication Status
app.get('/api/auth/check', (req, res) => {
  const cookies = getCookies(req);
  const sessionId = cookies.admin_session;

  if (sessionId && activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    if (session.expiry > Date.now()) {
      return res.json({ authenticated: true, username: session.username });
    } else {
      activeSessions.delete(sessionId);
    }
  }
  res.json({ authenticated: false });
});

// Change Password
app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  
  if (!currentPassword || !newUsername || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const db = readDb();
  const currentHash = hashPassword(currentPassword, db.admin.salt);

  if (currentHash !== db.admin.passwordHash) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  // Generate new secure salt and re-hash new password
  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);

  db.admin.username = newUsername;
  db.admin.passwordHash = newHash;
  db.admin.salt = newSalt;

  writeDb(db);

  // Invalidate all active sessions for security except this one, or just sign out
  const cookies = getCookies(req);
  const currentSessionId = cookies.admin_session;
  
  activeSessions.forEach((val, key) => {
    if (key !== currentSessionId) {
      activeSessions.delete(key);
    }
  });

  res.json({ success: true, message: 'Credentials updated successfully' });
});

// ─── PUBLIC DYNAMIC API ROUTES ──────────────────────────────

// Get Settings (Texts, Contacts, Stats)
app.get('/api/public/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings);
});

// Get Upcoming Events
app.get('/api/public/events', (req, res) => {
  const db = readDb();
  res.json(db.events);
});

// Get Internship Schedules
app.get('/api/public/internships', (req, res) => {
  const db = readDb();
  res.json(db.internships);
});

// Get Blogs list (Sorted by Date Descending)
app.get('/api/public/blogs', (req, res) => {
  const db = readDb();
  res.json(db.blogs);
});

// Get Single Blog Post by ID or Slug
app.get('/api/public/blogs/:idOrSlug', (req, res) => {
  const db = readDb();
  const idOrSlug = req.params.idOrSlug;
  
  const post = db.blogs.find(b => b.id === idOrSlug || b.slug === idOrSlug);
  if (post) {
    return res.json(post);
  }
  res.status(404).json({ error: 'Blog post not found' });
});

// Get Gallery Images list
app.get('/api/public/gallery', (req, res) => {
  const db = readDb();
  res.json(db.gallery);
});

// ─── ADMIN WRITING/CRUD API ROUTES (AUTHENTICATED) ──────────

// Update Settings
app.post('/api/admin/settings', requireAdmin, (req, res) => {
  const { hero, aboutIntro, contact, stats, workStats } = req.body;
  const db = readDb();

  if (hero) db.settings.hero = hero;
  if (aboutIntro) db.settings.aboutIntro = aboutIntro;
  if (contact) db.settings.contact = contact;
  if (stats) db.settings.stats = stats;
  if (workStats) db.settings.workStats = workStats;

  writeDb(db);
  res.json({ success: true, message: 'Settings saved successfully', settings: db.settings });
});

// Create Event
app.post('/api/admin/events', requireAdmin, (req, res) => {
  const { date, icon, title, description, location } = req.body;
  if (!date || !title || !description) {
    return res.status(400).json({ error: 'Date, Title, and Description are required' });
  }

  const db = readDb();
  const newEvent = {
    id: 'event-' + Date.now(),
    date,
    icon: icon || 'fa-calendar',
    title,
    description,
    location: location || ''
  };

  db.events.push(newEvent);
  writeDb(db);
  res.json({ success: true, message: 'Event added successfully', event: newEvent });
});

// Edit Event
app.put('/api/admin/events/:id', requireAdmin, (req, res) => {
  const eventId = req.params.id;
  const { date, icon, title, description, location } = req.body;

  const db = readDb();
  const eventIndex = db.events.findIndex(e => e.id === eventId);
  
  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  db.events[eventIndex] = {
    ...db.events[eventIndex],
    date: date || db.events[eventIndex].date,
    icon: icon || db.events[eventIndex].icon,
    title: title || db.events[eventIndex].title,
    description: description || db.events[eventIndex].description,
    location: location !== undefined ? location : db.events[eventIndex].location
  };

  writeDb(db);
  res.json({ success: true, message: 'Event updated successfully', event: db.events[eventIndex] });
});

// Delete Event
app.delete('/api/admin/events/:id', requireAdmin, (req, res) => {
  const eventId = req.params.id;
  const db = readDb();
  
  const initialLength = db.events.length;
  db.events = db.events.filter(e => e.id !== eventId);

  if (db.events.length === initialLength) {
    return res.status(404).json({ error: 'Event not found' });
  }

  writeDb(db);
  res.json({ success: true, message: 'Event deleted successfully' });
});

// Create/Update Internship Batches
app.post('/api/admin/internships', requireAdmin, (req, res) => {
  const { id, title, description, status, batch } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and Description are required' });
  }

  const db = readDb();
  const targetId = id || 'internship-1';
  
  let scheduleIndex = db.internships.findIndex(i => i.id === targetId);

  const scheduleData = {
    id: targetId,
    title,
    description,
    status: status || 'open',
    batch: batch || ''
  };

  if (scheduleIndex !== -1) {
    db.internships[scheduleIndex] = scheduleData;
  } else {
    db.internships.push(scheduleData);
  }

  writeDb(db);
  res.json({ success: true, message: 'Internship schedule updated successfully', internship: scheduleData });
});

// Create Blog Post (with Uploaded Cover Image)
app.post('/api/admin/blogs', requireAdmin, upload.single('coverImage'), (req, res) => {
  const { title, category, date, summary, content } = req.body;
  
  if (!title || !summary || !content) {
    // Delete uploaded file if form failed validation
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: 'Title, Summary, and Content are required' });
  }

  // Create cover image path
  let imagePath = 'images/index1.jpeg'; // default fallback
  if (req.file) {
    imagePath = 'uploads/' + req.file.filename;
  }

  // Generate slug
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const db = readDb();
  
  const newPost = {
    id: 'blog-' + Date.now(),
    slug,
    title,
    category: category || 'NGO Activities',
    date: date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    summary,
    content,
    image: imagePath
  };

  db.blogs.push(newPost);
  writeDb(db);
  res.json({ success: true, message: 'Blog post created successfully', blog: newPost });
});

// Edit Blog Post
app.put('/api/admin/blogs/:id', requireAdmin, upload.single('coverImage'), (req, res) => {
  const blogId = req.params.id;
  const { title, category, date, summary, content } = req.body;

  const db = readDb();
  const blogIndex = db.blogs.findIndex(b => b.id === blogId);
  
  if (blogIndex === -1) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(404).json({ error: 'Blog post not found' });
  }

  const post = db.blogs[blogIndex];
  let imagePath = post.image;

  if (req.file) {
    // Delete previous cover image if it was custom uploaded
    if (post.image.startsWith('uploads/')) {
      const prevPath = path.join(__dirname, post.image);
      if (fs.existsSync(prevPath)) {
        fs.unlinkSync(prevPath);
      }
    }
    imagePath = 'uploads/' + req.file.filename;
  }

  const newSlug = title ? title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') : post.slug;

  db.blogs[blogIndex] = {
    ...post,
    slug: newSlug,
    title: title || post.title,
    category: category || post.category,
    date: date || post.date,
    summary: summary || post.summary,
    content: content || post.content,
    image: imagePath
  };

  writeDb(db);
  res.json({ success: true, message: 'Blog post updated successfully', blog: db.blogs[blogIndex] });
});

// Delete Blog Post
app.delete('/api/admin/blogs/:id', requireAdmin, (req, res) => {
  const blogId = req.params.id;
  const db = readDb();
  
  const post = db.blogs.find(b => b.id === blogId);
  if (!post) {
    return res.status(404).json({ error: 'Blog post not found' });
  }

  // Delete cover image file if custom uploaded
  if (post.image.startsWith('uploads/')) {
    const imagePath = path.join(__dirname, post.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  db.blogs = db.blogs.filter(b => b.id !== blogId);
  writeDb(db);
  res.json({ success: true, message: 'Blog post deleted successfully' });
});

// Upload Gallery Image
app.post('/api/admin/gallery', requireAdmin, upload.single('galleryImage'), (req, res) => {
  const db = readDb();
  if (db.gallery && db.gallery.length >= 9) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: 'Maximum 9 images allowed. Please delete an existing image before uploading a new one.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const imagePath = 'uploads/' + req.file.filename;
  
  db.gallery.push(imagePath);
  writeDb(db);
  
  res.json({ success: true, message: 'Image uploaded to gallery successfully', image: imagePath });
});

// Delete Gallery Image
app.delete('/api/admin/gallery', requireAdmin, (req, res) => {
  const { imagePath } = req.body;
  if (!imagePath) {
    return res.status(400).json({ error: 'Image path is required' });
  }

  const db = readDb();
  const initialLength = db.gallery.length;
  db.gallery = db.gallery.filter(img => img !== imagePath);

  if (db.gallery.length === initialLength) {
    return res.status(404).json({ error: 'Image not found in gallery database' });
  }

  // Delete physical file if custom uploaded
  if (imagePath.startsWith('uploads/')) {
    const fileAbsPath = path.join(__dirname, imagePath);
    if (fs.existsSync(fileAbsPath)) {
      fs.unlinkSync(fileAbsPath);
    }
  }

  writeDb(db);
  res.json({ success: true, message: 'Image deleted from gallery successfully' });
});

// ─── DONATION & IMPACT GALLERY ROUTES ───────────────────────

// Get Donation Settings
app.get('/api/public/donation', (req, res) => {
  const db = readDb();
  res.json(db.settings.donation || {});
});

// Update Donation Settings
app.post('/api/admin/donation', requireAdmin, upload.single('qrImage'), (req, res) => {
  const { message, upiId } = req.body;
  const db = readDb();
  if (!db.settings.donation) db.settings.donation = {};
  
  if (message) db.settings.donation.message = message;
  if (upiId) db.settings.donation.upiId = upiId;
  
  if (req.file) {
    if (db.settings.donation.qrImage && db.settings.donation.qrImage.startsWith('uploads/')) {
      const prevPath = path.join(__dirname, db.settings.donation.qrImage);
      if (fs.existsSync(prevPath)) fs.unlinkSync(prevPath);
    }
    db.settings.donation.qrImage = 'uploads/' + req.file.filename;
  }
  
  writeDb(db);
  res.json({ success: true, message: 'Donation settings updated', donation: db.settings.donation });
});

// Get Impact Gallery
app.get('/api/public/impact-gallery', (req, res) => {
  const db = readDb();
  res.json(db.impactGallery || []);
});

// Create/Update Impact Gallery Event
app.post('/api/admin/impact-gallery', requireAdmin, upload.array('images', 10), (req, res) => {
  const { id, year, title, description, eventDate } = req.body;
  if (!year || !title) return res.status(400).json({ error: 'Year and Title are required' });
  
  const db = readDb();
  if (!db.impactGallery) db.impactGallery = [];
  
  const imagePaths = req.files ? req.files.map(f => 'uploads/' + f.filename) : [];
  
  if (id) {
    const idx = db.impactGallery.findIndex(i => i.id === id);
    if (idx !== -1) {
      db.impactGallery[idx].year = year;
      db.impactGallery[idx].title = title;
      db.impactGallery[idx].description = description || '';
      db.impactGallery[idx].eventDate = eventDate || '';
      if (imagePaths.length > 0) {
        db.impactGallery[idx].images = [...db.impactGallery[idx].images, ...imagePaths];
      }
      writeDb(db);
      return res.json({ success: true, message: 'Impact gallery event updated', event: db.impactGallery[idx] });
    }
  }
  
  const newEvent = {
    id: 'ig-' + Date.now(),
    year,
    title,
    description: description || '',
    eventDate: eventDate || '',
    images: imagePaths
  };
  
  db.impactGallery.push(newEvent);
  writeDb(db);
  res.json({ success: true, message: 'Impact gallery event created', event: newEvent });
});

// Delete Impact Gallery Event
app.delete('/api/admin/impact-gallery/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const db = readDb();
  if (!db.impactGallery) return res.status(404).json({ error: 'Not found' });
  
  const idx = db.impactGallery.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  
  const event = db.impactGallery[idx];
  event.images.forEach(imgPath => {
    if (imgPath.startsWith('uploads/')) {
      const fullPath = path.join(__dirname, imgPath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
  });
  
  db.impactGallery.splice(idx, 1);
  writeDb(db);
  res.json({ success: true, message: 'Impact gallery event deleted' });
});

// Delete specific image from Impact Gallery Event
app.delete('/api/admin/impact-gallery/:id/image', requireAdmin, (req, res) => {
  const id = req.params.id;
  const { imagePath } = req.body;
  const db = readDb();
  
  const idx = db.impactGallery.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  
  const imgIdx = db.impactGallery[idx].images.indexOf(imagePath);
  if (imgIdx !== -1) {
    db.impactGallery[idx].images.splice(imgIdx, 1);
    if (imagePath.startsWith('uploads/')) {
      const fullPath = path.join(__dirname, imagePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    writeDb(db);
    return res.json({ success: true, message: 'Image deleted' });
  }
  res.status(404).json({ error: 'Image not found in event' });
});

// ─── SEO: SITEMAP & ROBOTS ───────────────────────────────────

// Serve sitemap.xml with correct content-type
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = 'https://www.universalfoundationindia.com';
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const pages = [
    { url: '/',           changefreq: 'weekly',  priority: '1.0' },
    { url: '/about.html', changefreq: 'monthly', priority: '0.8' },
    { url: '/events.html',  changefreq: 'weekly',  priority: '0.9' },
    { url: '/work.html',  changefreq: 'monthly', priority: '0.7' },
    { url: '/blog.html',  changefreq: 'weekly',  priority: '0.8' },
    { url: '/donate.html',changefreq: 'monthly', priority: '0.8' },
    { url: '/contact.html',changefreq: 'monthly', priority: '0.7' },
  ];

  const urlEntries = pages.map(page => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

// Serve robots.txt
app.get('/robots.txt', (req, res) => {
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://www.universalfoundationindia.com/sitemap.xml`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(content);
});

// ─── SERVE FRONTEND STATIC FILES ────────────────────────────
// Mount workspace root directory as static content
app.use(express.static(path.join(__dirname)));

// Catch-all route to serve index.html for undefined files (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── START SERVER ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Universal Foundation CMS serving at: http://localhost:${PORT}`);
});
