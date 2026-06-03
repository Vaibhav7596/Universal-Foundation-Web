require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ─── CLOUDINARY CONFIGURATION ───────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dupqeboy3',
  api_key: process.env.CLOUDINARY_API_KEY || '529594381877661',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Dq4dK1m-2KE0GBuJX8NRzs630EU'
});
console.log(`[cloudinary] Configured for cloud: ${cloudinary.config().cloud_name}`);

const app = express();
const PORT = process.env.PORT || 3000;

// ─── INITIALIZE DIRECTORIES ─────────────────────────────────
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
const dbPath = path.join(dataDir, 'db.json');
const sessionsPath = path.join(dataDir, 'sessions.json'); // Separate file — never synced to MongoDB

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

let mongoClient = null;
let mongoCol = null;
let dbCache = null;

async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  const getSeededData = () => {
    const salt = generateSalt();
    const passwordHash = hashPassword(defaultPassword, salt);
    return {
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
        },
        {
          "id": "blog-3",
          "slug": "green-shield-tree-plantation-ecological-planning",
          "title": "The Green Shield: A Deep Dive into Tree Plantation and Ecological Planning",
          "category": "Environmental Action",
          "date": "24 May 2026",
          "summary": "Nursery visits, tree diversity learning, and ground logistics. Discover how Universal Foundation coordinates tree plantation drives for high sapling survival rates.",
          "content": "<p>Tree plantation drives are often viewed as simple one-off activities. However, at Universal Foundation, we know that true environmental restoration requires rigorous planning, local community involvement, and systematic execution. During our recent CSSI internship program, we took interns on a complete 3-day ecological journey—from nursery selection to ground preparation and active planting.</p><h3>Day 1: Nursery Visits and Biodiversity Studies</h3><p>We began at a local plant nursery, educating interns about native tree species, soil conditions, and regional climate resilience. Experts explained how different trees support local wildlife, lower regional temperatures, and clean local air. Every student was assigned specific native saplings to plant, learning soil-mixing and sapling-handling techniques.</p><h3>Day 2: Site Preparation and Pit Digging</h3><p>True logistics happened on day two. Working in coordinated volunteer teams under the supervision of senior NGO members, we cleared debris, dug systematically spaced pits, and mapped optimal areas on the designated green zone in Surat. This site preparation is key to ensuring that saplings receive proper resources and space to grow.</p><h3>Day 3: The Plantation Event</h3><p>On execution day, saplings were planted with care, and local community members actively joined the initiative. In total, hundreds of native trees were planted. The foundation works closely with local community teams to ensure these green belts are watered and nurtured regularly, fostering a shared sense of sustainable civic duty.</p>",
          "image": "images/events1.jpeg"
        },
        {
          "id": "blog-4",
          "slug": "ready-for-action-fire-safety-equipment-handling",
          "title": "Ready for Action: Fire Safety & Equipment Handling Training",
          "category": "Civil Defense",
          "date": "20 May 2026",
          "summary": "Go behind the scenes of our recent interactive fire station safety training, equipment simulations, and vehicle functionality drills.",
          "content": "<p>In an emergency, split-second decisions and precise muscle memory are the keys to saving lives. Through our partnership with regional fire department officials, Universal Foundation recently hosted a comprehensive, hands-on fire safety and rescue equipment training program for our civil safety interns.</p><h3>Day 1: Interactive Fire Station Visits</h3><p>The program kicked off with an immersive visit to the local fire station. Interns met active firefighting personnel and held interactive discussions about real-life emergency scenarios, crisis response workflows, and the extreme coordination required of public safety systems under stress.</p><h3>Day 2: Fire Extinguisher and Evacuation Drills</h3><p>Day two was fully hands-on. Trainees were introduced to different classes of fires (Class A, B, C, D) and practiced selecting and deploying the correct fire extinguishers. We simulated evacuation paths under thick smoke and taught firefighters' carries and rescue carries to handle injured or stranded citizens safely.</p><h3>Day 3: Fire Engine Demonstrations</h3><p>We concluded with a complete technical walkthrough of dynamic fire vehicle mechanics. Trainees learned about high-pressure water pumps, hose layouts, ladders, and watched live demonstrations of fire truck deployment in real-time. This empowering, practical training gives ordinary citizens the skills to respond safely and prevent small fires from turning into major catastrophes.</p>",
          "image": "images/events3.jpeg"
        },
        {
          "id": "blog-5",
          "slug": "sentinel-water-tapi-cleanup-flood-rescue",
          "title": "Sentinel of the Water: Tapi River Cleanliness & Flood Rescue Simulations",
          "category": "Disaster Management",
          "date": "10 May 2026",
          "summary": "Cleaning the Tapi riverbank and training volunteers in flood rescue operations using inflatable boats, lifejackets, and rescue signaling tools.",
          "content": "<p>Water bodies are the lifeblood of our cities, yet they are increasingly threatened by solid waste pollution. In a major community drive led by Universal Foundation, our teams combined Swachh Bharat cleanliness objectives with hands-on flood emergency rescue training on the banks of the Tapi River in Surat.</p><h3>Cleanliness Drive: The Tapi Cleanup</h3><p>Focusing on the Tapi riverbank, volunteers and interns actively removed large amounts of plastic waste, discarded non-biodegradable debris, and solid trash. Mentors gave brief on-site lectures detailing how river pollution severely impacts regional groundwater reservoirs and disrupts riverbed ecosystems. The cleanup drive emphasized waste segregation and correct disposal workflows.</p><h3>Emergency Preparedness: Flood Rescue Operations</h3><p>Surat has faced historical flood challenges, making water rescue training a critical skill. Our trainers led flood simulation drills where interns learned the proper use of life jackets, throwing rescue lines/ropes, operating signaling tools, and boarding inflatable rescue boats. Instructors shared operational rescue experiences and built composure techniques to keep stranded citizens calm during actual floods. This hybrid environmental-emergency event leaves our youth equipped to protect both nature and human lives.</p>",
          "image": "images/events2.jpeg"
        }
      ],
      impactGallery: [
        {
          "id": "ig-1",
          "year": "2026",
          "title": "Health Camp & Food Distribution",
          "description": "Organized health check-ups and distributed ration kits.",
          "eventDate": "15 May 2026",
          "images": [
            "images/index1of3.jpeg",
            "images/index2of3.jpeg"
          ]
        }
      ]
    };
  };

  if (mongoUri) {
    const redactMongoUri = (uri) => {
      if (!uri) return 'undefined';
      return uri.replace(/:([^:@]+)@/, ':******@');
    };
    console.log(`[initDatabase] MONGODB_URI provided. Connecting to: ${redactMongoUri(mongoUri)}`);
    try {
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      console.log("[initDatabase] MongoDB connection established successfully.");
      const db = mongoClient.db("universal_foundation");
      mongoCol = db.collection("cms_store");
      console.log(`[initDatabase] Using database: "${db.databaseName}", collection: "${mongoCol.collectionName}"`);
      
      const doc = await mongoCol.findOne({ _id: "site_state" });
      if (doc) {
        const { _id, ...cleanData } = doc;
        dbCache = cleanData;
        console.log("✅ Successfully loaded CMS state from MongoDB Atlas.");
      } else {
        console.log("⚠️ No state found in MongoDB Atlas. Seeding data...");
        let seed = null;
        if (fs.existsSync(dbPath)) {
          try {
            seed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            console.log("Found existing local db.json. Migrating local data to MongoDB Atlas...");
          } catch (e) {
            console.error("Failed to parse local db.json, generating default data:", e);
          }
        }
        if (!seed) {
          seed = getSeededData();
        }
        await mongoCol.replaceOne({ _id: "site_state" }, seed, { upsert: true });
        dbCache = seed;
        console.log("✅ CMS state successfully seeded and saved to MongoDB Atlas.");
      }

      // Write local backup copy
      fs.writeFileSync(dbPath, JSON.stringify(dbCache, null, 2));

    } catch (error) {
      console.error("❌ MongoDB connection or query failed:", error);
      console.log("Falling back to local file db.json.");
      mongoCol = null;
      mongoClient = null;
    }
  } else {
    console.warn("⚠️ MONGODB_URI environment variable is not defined or empty.");
  }

  // Fallback if MONGODB_URI is not provided or if connection failed
  if (!dbCache) {
    console.log("Initializing local file-based database...");
    if (!fs.existsSync(dbPath)) {
      dbCache = getSeededData();
      fs.writeFileSync(dbPath, JSON.stringify(dbCache, null, 2));
      console.log(`
==================================================
CMS LOCAL DATABASE INITIALIZED (Fallback)
Admin Username: ${defaultUsername}
Admin Password: ${defaultPassword}
==================================================
      `);
    } else {
      try {
        dbCache = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        console.log("✅ Successfully loaded CMS state from local db.json.");
      } catch (e) {
        console.error("❌ Failed to load local db.json, generating default data:", e);
        dbCache = getSeededData();
        fs.writeFileSync(dbPath, JSON.stringify(dbCache, null, 2));
      }
    }
  }

  // Ensure default blogs and impact gallery exist in the loaded cache (from either Mongo or local)
  if (dbCache) {
    if (!dbCache.blogs) {
      dbCache.blogs = [];
    }
    const defaultBlogs = [
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
      },
      {
        "id": "blog-3",
        "slug": "green-shield-tree-plantation-ecological-planning",
        "title": "The Green Shield: A Deep Dive into Tree Plantation and Ecological Planning",
        "category": "Environmental Action",
        "date": "24 May 2026",
        "summary": "Nursery visits, tree diversity learning, and ground logistics. Discover how Universal Foundation coordinates tree plantation drives for high sapling survival rates.",
        "content": "<p>Tree plantation drives are often viewed as simple one-off activities. However, at Universal Foundation, we know that true environmental restoration requires rigorous planning, local community involvement, and systematic execution. During our recent CSSI internship program, we took interns on a complete 3-day ecological journey—from nursery selection to ground preparation and active planting.</p><h3>Day 1: Nursery Visits and Biodiversity Studies</h3><p>We began at a local plant nursery, educating interns about native tree species, soil conditions, and regional climate resilience. Experts explained how different trees support local wildlife, lower regional temperatures, and clean local air. Every student was assigned specific native saplings to plant, learning soil-mixing and sapling-handling techniques.</p><h3>Day 2: Site Preparation and Pit Digging</h3><p>True logistics happened on day two. Working in coordinated volunteer teams under the supervision of senior NGO members, we cleared debris, dug systematically spaced pits, and mapped optimal areas on the designated green zone in Surat. This site preparation is key to ensuring that saplings receive proper resources and space to grow.</p><h3>Day 3: The Plantation Event</h3><p>On execution day, saplings were planted with care, and local community members actively joined the initiative. In total, hundreds of native trees were planted. The foundation works closely with local community teams to ensure these green belts are watered and nurtured regularly, fostering a shared sense of sustainable civic duty.</p>",
        "image": "images/events1.jpeg"
      },
      {
        "id": "blog-4",
        "slug": "ready-for-action-fire-safety-equipment-handling",
        "title": "Ready for Action: Fire Safety & Equipment Handling Training",
        "category": "Civil Defense",
        "date": "20 May 2026",
        "summary": "Go behind the scenes of our recent interactive fire station safety training, equipment simulations, and vehicle functionality drills.",
        "content": "<p>In an emergency, split-second decisions and precise muscle memory are the keys to saving lives. Through our partnership with regional fire department officials, Universal Foundation recently hosted a comprehensive, hands-on fire safety and rescue equipment training program for our civil safety interns.</p><h3>Day 1: Interactive Fire Station Visits</h3><p>The program kicked off with an immersive visit to the local fire station. Interns met active firefighting personnel and held interactive discussions about real-life emergency scenarios, crisis response workflows, and the extreme coordination required of public safety systems under stress.</p><h3>Day 2: Fire Extinguisher and Evacuation Drills</h3><p>Day two was fully hands-on. Trainees were introduced to different classes of fires (Class A, B, C, D) and practiced selecting and deploying the correct fire extinguishers. We simulated evacuation paths under thick smoke and taught firefighters' carries and rescue carries to handle injured or stranded citizens safely.</p><h3>Day 3: Fire Engine Demonstrations</h3><p>We concluded with a complete technical walkthrough of dynamic fire vehicle mechanics. Trainees learned about high-pressure water pumps, hose layouts, ladders, and watched live demonstrations of fire truck deployment in real-time. This empowering, practical training gives ordinary citizens the skills to respond safely and prevent small fires from turning into major catastrophes.</p>",
        "image": "images/events3.jpeg"
      },
      {
        "id": "blog-5",
        "slug": "sentinel-water-tapi-cleanup-flood-rescue",
        "title": "Sentinel of the Water: Tapi River Cleanliness & Flood Rescue Simulations",
        "category": "Disaster Management",
        "date": "10 May 2026",
        "summary": "Cleaning the Tapi riverbank and training volunteers in flood rescue operations using inflatable boats, lifejackets, and rescue signaling tools.",
        "content": "<p>Water bodies are the lifeblood of our cities, yet they are increasingly threatened by solid waste pollution. In a major community drive led by Universal Foundation, our teams combined Swachh Bharat cleanliness objectives with hands-on flood emergency rescue training on the banks of the Tapi River in Surat.</p><h3>Cleanliness Drive: The Tapi Cleanup</h3><p>Focusing on the Tapi riverbank, volunteers and interns actively removed large amounts of plastic waste, discarded non-biodegradable debris, and solid trash. Mentors gave brief on-site lectures detailing how river pollution severely impacts regional groundwater reservoirs and disrupts riverbed ecosystems. The cleanup drive emphasized waste segregation and correct disposal workflows.</p><h3>Emergency Preparedness: Flood Rescue Operations</h3><p>Surat has faced historical flood challenges, making water rescue training a critical skill. Our trainers led flood simulation drills where interns learned the proper use of life jackets, throwing rescue lines/ropes, operating signaling tools, and boarding inflatable rescue boats. Instructors shared operational rescue experiences and built composure techniques to keep stranded citizens calm during actual floods. This hybrid environmental-emergency event leaves our youth equipped to protect both nature and human lives.</p>",
        "image": "images/events2.jpeg"
      }
    ];

    let hasUpdates = false;
    for (const defBlog of defaultBlogs) {
      if (!dbCache.blogs.some(b => b.id === defBlog.id || b.slug === defBlog.slug)) {
        console.log(`Adding missing default blog: ${defBlog.title}`);
        dbCache.blogs.push(defBlog);
        hasUpdates = true;
      }
    }

    if (!dbCache.impactGallery || dbCache.impactGallery.length === 0) {
      console.log("Adding missing default impactGallery...");
      dbCache.impactGallery = [
        {
          "id": "ig-1",
          "year": "2026",
          "title": "Health Camp & Food Distribution",
          "description": "Organized health check-ups and distributed ration kits.",
          "eventDate": "15 May 2026",
          "images": [
            "images/index1of3.jpeg",
            "images/index2of3.jpeg"
          ]
        }
      ];
      hasUpdates = true;
    }

    if (hasUpdates) {
      console.log("Database default elements updated. Triggering database write sync...");
      writeDb(dbCache);
    }
  }
}

// Helper to read DB
function readDb() {
  return dbCache;
}

// Helper to write DB
function writeDb(data) {
  console.log(`[writeDb] Triggered. mongoCol: ${mongoCol ? "connected" : "null/offline"}`);
  dbCache = data;
  
  // Write to local cache file
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log(`[writeDb] Local backup successfully updated at ${dbPath}`);
  } catch (err) {
    console.error("[writeDb] Failed to write local backup:", err);
  }

  // Asynchronously save to MongoDB if connected
  if (mongoCol) {
    const docToSave = { _id: "site_state", ...data };
    console.log(`[writeDb] Syncing to MongoDB Atlas (_id: site_state). Summary: ${data.blogs ? data.blogs.length : 0} blogs, ${data.events ? data.events.length : 0} events, ${data.gallery ? data.gallery.length : 0} gallery items.`);
    
    mongoCol.replaceOne({ _id: "site_state" }, docToSave, { upsert: true })
      .then(result => {
        console.log(`✅ [writeDb] MongoDB Atlas sync successful.`);
        console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}, Acknowledged: ${result.acknowledged}`);
      })
      .catch(err => {
        console.error("❌ [writeDb] Async write to MongoDB Atlas failed:", err);
      });
  } else {
    console.warn("⚠️ [writeDb] Sync skipped: mongoCol is offline/null.");
  }
}

// ─── MIDDLEWARES ────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
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

// ─── PERSISTENT SESSION HELPERS ─────────────────────────────
// Sessions are stored in a SEPARATE file (data/sessions.json).
// They must NEVER be written to MongoDB via writeDb() to avoid
// overwriting blog/event data in Atlas on every auth request.

function getSessions() {
  try {
    if (fs.existsSync(sessionsPath)) {
      return JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
    }
  } catch (e) {
    console.error('[sessions] Failed to read sessions.json:', e);
  }
  return {};
}

function saveSessions(sessions) {
  try {
    fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
  } catch (e) {
    console.error('[sessions] Failed to write sessions.json:', e);
  }
}

function purgeExpiredSessions() {
  const sessions = getSessions();
  const now = Date.now();
  let changed = false;
  Object.keys(sessions).forEach(id => {
    if (sessions[id].expiry <= now) {
      delete sessions[id];
      changed = true;
    }
  });
  if (changed) saveSessions(sessions);
}

// Authentication Verification Middleware
function requireAdmin(req, res, next) {
  const cookies = getCookies(req);
  const sessionId = cookies.admin_session;

  if (sessionId) {
    const sessions = getSessions();
    const session = sessions[sessionId];
    if (session && session.expiry > Date.now()) {
      req.adminUser = session.username;
      // Slide the expiry window on every request (2 hr inactivity timeout)
      session.expiry = Date.now() + 2 * 60 * 60 * 1000;
      sessions[sessionId] = session;
      saveSessions(sessions);
      return next();
    }
    // Expired — clean it up
    if (session) {
      const sessions2 = getSessions();
      delete sessions2[sessionId];
      saveSessions(sessions2);
    }
  }

  res.status(401).json({ error: 'Unauthorized: Invalid or expired session. Please log in again.' });
}

// ─── FILE UPLOAD STORAGE CONFIGURATION (Cloudinary) ────────────────
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'universal-foundation',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
  }
});

const upload = multer({
  storage: cloudinaryStorage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, png, webp, gif) are allowed!'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
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

      // Persist session to db.json (survives server restarts)
      purgeExpiredSessions();
      const sessions = getSessions();
      sessions[sessionId] = { username: db.admin.username, expiry: sessionExpiry };
      saveSessions(sessions);

      // Set cookie header (24h max-age so browser keeps it across restarts)
      res.setHeader('Set-Cookie', `admin_session=${sessionId}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);
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
    const sessions = getSessions();
    delete sessions[sessionId];
    saveSessions(sessions);
  }

  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Check Session Authentication Status
app.get('/api/auth/check', (req, res) => {
  const cookies = getCookies(req);
  const sessionId = cookies.admin_session;

  if (sessionId) {
    const sessions = getSessions();
    const session = sessions[sessionId];
    if (session && session.expiry > Date.now()) {
      return res.json({ authenticated: true, username: session.username });
    } else {
      // Expired — remove from persistent store
      delete sessions[sessionId];
      saveSessions(sessions);
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

// Get Upcoming Events (Sorted by Date Descending, Newest First)
app.get('/api/public/events', (req, res) => {
  const db = readDb();

  const parseDate = (dStr) => {
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const getTimestampFromId = (id) => {
    if (typeof id === 'string' && id.startsWith('event-')) {
      const ts = parseInt(id.split('-')[1]);
      return isNaN(ts) ? 0 : ts;
    }
    return 0;
  };

  const sortedEvents = [...db.events].sort((a, b) => {
    const timeA = parseDate(a.date);
    const timeB = parseDate(b.date);
    if (timeA !== timeB) {
      return timeA - timeB; // Earliest upcoming event first
    }
    return getTimestampFromId(a.id) - getTimestampFromId(b.id);
  });

  res.json(sortedEvents);
});

// Get Internship Schedules
app.get('/api/public/internships', (req, res) => {
  const db = readDb();
  res.json(db.internships);
});

// Get Blogs list (Sorted by Date Descending, Newest First)
app.get('/api/public/blogs', (req, res) => {
  const db = readDb();
  
  const parseDate = (dStr) => {
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const getTimestampFromId = (id) => {
    if (typeof id === 'string' && id.startsWith('blog-')) {
      const ts = parseInt(id.split('-')[1]);
      return isNaN(ts) ? 0 : ts;
    }
    return 0;
  };

  const sortedBlogs = [...db.blogs].sort((a, b) => {
    const timeA = parseDate(a.date);
    const timeB = parseDate(b.date);
    if (timeA !== timeB) {
      return timeB - timeA;
    }
    return getTimestampFromId(b.id) - getTimestampFromId(a.id);
  });

  res.json(sortedBlogs);
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

// Get Gallery Images list (Newest First)
app.get('/api/public/gallery', (req, res) => {
  const db = readDb();
  res.json([...db.gallery].reverse());
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
    imagePath = req.file.path; // Cloudinary URL
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
    return res.status(404).json({ error: 'Blog post not found' });
  }

  const post = db.blogs[blogIndex];

  let newImagePath = post.image;
  if (req.file) {
    newImagePath = req.file.path; // Cloudinary URL
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
    image: newImagePath
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

  db.blogs = db.blogs.filter(b => b.id !== blogId);
  writeDb(db);
  res.json({ success: true, message: 'Blog post deleted successfully' });
});

// Upload Gallery Image
app.post('/api/admin/gallery', requireAdmin, upload.single('galleryImage'), (req, res) => {
  const db = readDb();
  if (db.gallery && db.gallery.length >= 9) {
    return res.status(400).json({ error: 'Maximum 9 images allowed. Please delete an existing image before uploading a new one.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const imagePath = req.file.path; // Cloudinary URL
  
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
    db.settings.donation.qrImage = req.file.path; // Cloudinary URL
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
  
  const imagePaths = req.files ? req.files.map(f => f.path) : []; // Cloudinary URLs
  
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

// Database status debugging endpoint
app.get('/api/public/db-status', (req, res) => {
  res.json({
    mongoConnected: !!mongoCol,
    mongoCollectionName: mongoCol ? mongoCol.collectionName : null,
    dbPathExists: fs.existsSync(dbPath),
    cacheStats: {
      hasBlogs: Array.isArray(dbCache.blogs),
      blogsCount: dbCache.blogs ? dbCache.blogs.length : 0,
      hasEvents: Array.isArray(dbCache.events),
      eventsCount: dbCache.events ? dbCache.events.length : 0,
      hasGallery: Array.isArray(dbCache.gallery),
      galleryCount: dbCache.gallery ? dbCache.gallery.length : 0,
      hasImpactGallery: Array.isArray(dbCache.impactGallery),
      impactGalleryCount: dbCache.impactGallery ? dbCache.impactGallery.length : 0,
      settingsKeys: dbCache.settings ? Object.keys(dbCache.settings) : []
    }
  });
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

// ─── FAVICON ROUTES (must be before static/catch-all) ────────
const faviconFiles = {
  '/favicon.ico':         'favicon.ico',
  '/favicon-32x32.png':  'favicon-32x32.png',
  '/favicon-16x16.png':  'favicon-16x16.png',
  '/apple-touch-icon.png': 'apple-touch-icon.png',
  '/favicon-192x192.png': 'favicon-192x192.png',
};

Object.entries(faviconFiles).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    const ext = path.extname(file).toLowerCase();
    const mimeType = ext === '.ico' ? 'image/x-icon' : 'image/png';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 1 day
    res.sendFile(path.join(__dirname, file));
  });
});

// ─── SERVE FRONTEND STATIC FILES ────────────────────────────
// Mount workspace root directory as static content
app.use(express.static(path.join(__dirname)));

// Catch-all route to serve index.html for undefined files (optional)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── START SERVER WITH DATABASE INITIALIZATION ─────────────
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Universal Foundation CMS serving at: http://localhost:${PORT}`);
  });
}
startServer();
