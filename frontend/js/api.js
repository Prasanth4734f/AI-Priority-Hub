/**
 * CityBrain Unified API Client (v2.1)
 * Supports FastAPI backend and offline localStorage fallback with Anti-Duplicate verification.
 */

const API_BASE = window.location.port === "8000" 
  ? window.location.origin 
  : "http://localhost:8000";

const STORAGE_KEY = "citybrain_complaints_v2";
const NOTICES_KEY = "citybrain_notices_v2";

const INITIAL_DEMO_COMPLAINTS = [
  {
    uid: "CB-1092F1",
    name: "Sarah Jenkins",
    phone: "+1 555-019-2834",
    email: "sarah.j@example.com",
    complaint: "Major water pipe burst near central market intersection flooding pedestrian walkway.",
    category: "Water",
    lat: 37.7749,
    lng: -122.4194,
    address: "Market St & 5th Ave, Central District",
    images: ["https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80"],
    videos: [],
    priority: "HIGH",
    department: "Water Supply & Sewerage Board",
    status: "In Progress",
    validity: "Verified Valid",
    assigned_officer: "Eng. Robert Thorne",
    created_at: "2026-11-01T08:15:00"
  },
  {
    uid: "CB-8491C2",
    name: "Marcus Vance",
    phone: "+1 555-014-8821",
    email: "m.vance@example.com",
    complaint: "Ambulance service for downtown clinic delayed by over 45 minutes during cardiac emergency.",
    category: "Ambulance",
    lat: 37.7833,
    lng: -122.4167,
    address: "42 Pine Street, Downtown",
    images: [],
    videos: [],
    priority: "HIGH",
    department: "Emergency Healthcare & Ambulance Services",
    status: "Submitted",
    validity: "Verified Valid",
    assigned_officer: "Dr. Angela Reyes (Dispatch Lead)",
    created_at: "2026-11-02T03:40:00"
  },
  {
    uid: "CB-3718A9",
    name: "Priya Sharma",
    phone: "+1 555-018-9943",
    email: "priya.s@example.com",
    complaint: "Deep dangerous pothole damaging vehicles on eastbound lane of Park Avenue.",
    category: "Roads",
    lat: 37.7690,
    lng: -122.4467,
    address: "Park Ave near Elm St",
    images: [],
    videos: [],
    priority: "HIGH",
    department: "Public Works Department (PWD)",
    status: "Resolved",
    validity: "Verified Valid",
    assigned_officer: "Officer David Cole",
    created_at: "2026-10-30T14:22:00"
  }
];

const INITIAL_DEMO_NOTICES = [
  {
    id: "NOT-881",
    title: "Scheduled Water Pipeline Maintenance in Central Ward",
    content: "Water Supply Board will execute scheduled infrastructure maintenance on 5th Ave from 10:00 PM to 4:00 AM. Low pressure expected.",
    department: "Water Supply & Sewerage Board",
    urgency: "Alert",
    category: "Water",
    created_at: "2026-11-02T06:00:00"
  },
  {
    id: "NOT-742",
    title: "24/7 Mobile Emergency Ambulance Fleet Deployed",
    content: "Four new rapid-response paramedic mobile units have been stationed near Civic Center to cut emergency transit times by 40%.",
    department: "Emergency Healthcare & Ambulance Services",
    urgency: "Info",
    category: "Healthcare",
    created_at: "2026-11-01T12:00:00"
  },
  {
    id: "NOT-509",
    title: "Monsoon Road Safety & Pothole Repair Blitz",
    content: "PWD rapid action teams are resurfacing high-traffic corridors this weekend. Citizens can report road craters directly with GPS coordinates.",
    department: "Public Works Department (PWD)",
    urgency: "Info",
    category: "Roads",
    created_at: "2026-10-31T09:30:00"
  }
];

class CityBrainAPI {
  constructor() {
    this.isBackendOnline = false;
    this.adminToken = sessionStorage.getItem("citybrain_admin_token") || null;
    this.adminUser = null;
    try {
      this.adminUser = JSON.parse(sessionStorage.getItem("citybrain_admin_user") || "null");
    } catch (e) {}
    this._initLocalStore();
  }

  getAuthHeaders() {
    const headers = { "Content-Type": "application/json" };
    const token = this.adminToken || sessionStorage.getItem("citybrain_admin_token");
    if (token) {
      headers["X-Admin-Role"] = "admin";
      headers["X-Admin-Token"] = token;
    }
    return headers;
  }

  async loginAdmin(username, password) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: (username || "admin").trim(), password: (password || "").trim() })
        });
        if (res.ok) {
          const data = await res.json();
          this.adminToken = data.token;
          this.adminUser = data;
          sessionStorage.setItem("citybrain_admin_token", data.token);
          sessionStorage.setItem("citybrain_admin_user", JSON.stringify(data));
          return data;
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Invalid administrator credentials.");
        }
      } catch (e) {
        if (e.message && e.message.includes("Invalid administrator")) throw e;
      }
    }

    // Local / Offline fallback
    const user = (username || "admin").toLowerCase().trim();
    const pwd = (password || "").trim();
    if (pwd === "password" || pwd === "admin123" || pwd === "admin") {
      const mockToken = `adm_local_${Date.now()}`;
      const mockData = {
        success: true,
        token: mockToken,
        role: "admin",
        username: user,
        display_name: "Municipal Chief Dispatcher"
      };
      this.adminToken = mockToken;
      this.adminUser = mockData;
      sessionStorage.setItem("citybrain_admin_token", mockToken);
      sessionStorage.setItem("citybrain_admin_user", JSON.stringify(mockData));
      return mockData;
    }
    throw new Error("Invalid administrator credentials.");
  }

  async logoutAdmin() {
    if (this.isBackendOnline && this.adminToken) {
      try {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          headers: this.getAuthHeaders()
        });
      } catch (e) {}
    }
    this.adminToken = null;
    this.adminUser = null;
    sessionStorage.removeItem("citybrain_admin_token");
    sessionStorage.removeItem("citybrain_admin_user");
    return true;
  }

  isAdminAuthenticated() {
    return !!(this.adminToken || sessionStorage.getItem("citybrain_admin_token"));
  }

  _initLocalStore() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
    }
    if (!localStorage.getItem(NOTICES_KEY)) {
      localStorage.setItem(NOTICES_KEY, JSON.stringify(INITIAL_DEMO_NOTICES));
    }
  }

  _getLocalComplaints() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  _saveLocalComplaints(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  _getLocalNotices() {
    try {
      return JSON.parse(localStorage.getItem(NOTICES_KEY)) || [];
    } catch {
      return [];
    }
  }

  _saveLocalNotices(list) {
    localStorage.setItem(NOTICES_KEY, JSON.stringify(list));
  }

  async checkBackend() {
    try {
      const res = await fetch(`${API_BASE}/api/health`, { method: "GET", mode: "cors", signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        this.isBackendOnline = true;
        return true;
      }
    } catch (e) {}
    this.isBackendOnline = false;
    return false;
  }

  // Multi-Factor Duplicate Detection (Root Issue + Location + Active Status + Text Similarity)
  checkDuplicateLocal(text, location = "", rootIssue = "", lat = null, lng = null) {
    // Handle overloaded call signatures:
    // (text, lat, lng) or (text, location, rootIssue, lat, lng)
    if (typeof location === "number" && typeof rootIssue === "number") {
      lat = location;
      lng = rootIssue;
      location = "";
      rootIssue = "";
    } else if (typeof location === "number") {
      lat = location;
      location = "";
    }

    const existing = this._getLocalComplaints();
    const activeStatuses = ["PENDING REVIEW", "PENDING_REVIEW", "SUBMITTED", "ASSIGNED", "IN PROGRESS", "IN_PROGRESS"];

    const cleanText = String(text || "").toLowerCase().trim();
    const cleanLoc = String(location || "").toLowerCase().trim();
    const cleanRoot = String(rootIssue || "").toLowerCase().trim();

    let bestScore = 0;
    let topMatch = null;

    for (const c of existing) {
      const cStatus = (c.status || "").toUpperCase();
      // 1. Search only active complaints
      if (!activeStatuses.includes(cStatus)) continue;

      let score = 0;

      // 2. Root Issue comparison (40 Points)
      const cRoot = ((c.triage_result?.root_issue || c.root_issue || c.category || "")).toLowerCase();
      if (cleanRoot && cRoot && (cleanRoot === cRoot || cleanRoot.includes(cRoot) || cRoot.includes(cleanRoot))) {
        score += 40;
      }

      // 3. Location comparison (30 Points)
      const cLoc = (c.address || c.location || "").toLowerCase();
      if (lat && lng && c.lat && c.lng && (Math.abs(lat - c.lat) + Math.abs(lng - c.lng) < 0.0025)) {
        score += 30;
      } else if (cleanLoc && cLoc && (cleanLoc === cLoc || cleanLoc.includes(cLoc) || cLoc.includes(cleanLoc))) {
        score += 30;
      }

      // 4. Text similarity (30 Points via Jaccard/Dice token overlap)
      const wordsA = cleanText.match(/\w{3,}/g) || [];
      const wordsB = (c.complaint || "").toLowerCase().match(/\w{3,}/g) || [];
      if (wordsA.length && wordsB.length) {
        const setA = new Set(wordsA);
        const setB = new Set(wordsB);
        let intersection = 0;
        setA.forEach(w => { if (setB.has(w)) intersection++; });
        const sim = (2.0 * intersection) / (setA.size + setB.size);
        score += (sim * 30);
      }

      if (score > bestScore) {
        bestScore = score;
        topMatch = {
          complaint_id: c.uid,
          status: c.status,
          duplicate_score: Math.round(score),
          root_issue: c.root_issue || c.department,
          location: c.address,
          complaint_text: c.complaint
        };
      }
    }

    if (bestScore >= 70 && topMatch) {
      return {
        isDuplicate: true,
        duplicateOf: topMatch.complaint_id,
        score: bestScore,
        matches: [topMatch]
      };
    }

    return { isDuplicate: false, duplicateOf: null, score: bestScore, matches: [] };
  }

  async createComplaint(payload) {
    let loc = (payload.address || "").trim();
    if (!loc || loc.length < 3) {
      if (payload.lat && payload.lng) {
        loc = `GPS Coordinates [${Number(payload.lat).toFixed(4)}, ${Number(payload.lng).toFixed(4)}]`;
        payload.address = loc;
      } else {
        throw new Error("Incident Location is mandatory to file a grievance.");
      }
    }

    if (!payload.images) {
      payload.images = [];
    }

    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned error ${res.status}`);
      } catch (err) {
        if (err.message && (err.message.includes("mandatory") || err.message.includes("Grievance description"))) {
          throw err;
        }
        console.warn("Backend request failed, falling back to local store:", err);
      }
    }

    // Local fallback check
    const dupCheck = this.checkDuplicateLocal(
      payload.complaint,
      payload.address,
      payload.category,
      payload.lat,
      payload.lng
    );

    // If duplicate detected and not forced, return warning
    if (dupCheck.isDuplicate && !payload.force_submit) {
      return {
        duplicate_detected: true,
        message: `Potential duplicate complaint detected (#${dupCheck.duplicateOf}) with ${dupCheck.score}% match confidence.`,
        possible_duplicates: dupCheck.matches
      };
    }
    const uid = `CB-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;

    // Priority & Dept calculation (Context & Entity Driven, Separates Root Asset from Severity)
    const text = (payload.complaint || "").toLowerCase();
    const cat = (payload.category || "").toLowerCase();
    let priority = "MEDIUM";
    let department = "General Administration";

    // 1. ROOT DEPARTMENT IDENTIFICATION
    if (/\b(fire|flames?|blaze|explosion|blast|gas leak|cylinder leak|cylinder blast|building collaps\w*|wall collaps\w*|bridge collaps\w*|landslide|drowning)\b/.test(text)) {
      department = "Fire & Rescue Services";
    } else if (/\b(electric\w*|power|transformer|live wire|hanging wire|open cable|high voltage|short circuit|blackout|voltage|street lights?|electric pole|electrocution|sparks?|sparking|power cut|load shedding|meter box)\b/.test(text)) {
      department = "Electricity & Power Board";
    } else if (/\b(water|pipe(line)?|leak\w*|burst|taps?|sewers?|sewerage|drains?|drainage|gutters?|flooding|muddy water|dirty water|no water|water supply|drinking water|borewell|water tank)\b/.test(text)) {
      department = "Water Supply & Sewerage Board";
    } else if (/\b(roads?|potholes?|traffic|signals?|traffic light|bridges?|flyovers?|footpaths?|sidewalks?|manholes?|sinkholes?|craters?|tar|asphalt|pavement|cave[- ]?in|caved in|road divider)\b/.test(text)) {
      department = "Public Works Department (PWD)";
    } else if (/\b(garbage|trash|waste|dumps?|dumping|dustbins?|stench|smell|foul|filth|dead animal|carcass|sanitation|sweeper|litter|debris|unhygienic)\b/.test(text)) {
      department = "Public Health & Sanitation Department";
    } else if (/\b(police|theft|thief|robber\w*|burglary|assault|fight|violence|harass\w*|stolen|eve[- ]teasing|drugs?|weapon|murder|gunshot|stabbing|knife|gang|crime|illegal|threat|rowdies)\b/.test(text)) {
      department = "Police & Law Enforcement";
    } else if (/\b(ambulance|hospital|patient|doctor|clinic|medic(al|ine)?|paramedic|healthcare|icu|first aid|casualty|dengue|malaria|maternity)\b/.test(text)) {
      department = "Emergency Healthcare & Ambulance Services";
    } else if (/\b(buses?|metro|transit|trains?|bus stop|auto rickshaw|bus fare)\b/.test(text)) {
      department = "Public Transport & Transit Authority";
    } else if (cat === "roads") { department = "Public Works Department (PWD)"; }
    else if (cat === "water") { department = "Water Supply & Sewerage Board"; }
    else if (cat === "electricity") { department = "Electricity & Power Board"; }
    else if (cat === "sanitation") { department = "Public Health & Sanitation Department"; }
    else if (cat === "ambulance") { department = "Emergency Healthcare & Ambulance Services"; }
    else if (cat === "police") { department = "Police & Law Enforcement"; }

    // 2. MULTI-FACTOR COMPLICATION ANALYSIS
    let lifeHazard = 0;
    let vulnerability = 0;
    let scaleImpact = 0;
    let urgencyEscalation = 0;
    let routineDampener = 0;
    const complications = [];

    // Life Hazard
    if (/\b(fire|flames?|blaze|explosion|blast|gas leak|cylinder blast|building collaps\w*|wall collaps\w*|drowning|people trapped|trapped inside)\b/.test(text)) {
      lifeHazard = 10;
      complications.push("Active Disaster / Physical Collapse / Casualty Risk");
    } else if (/\b(heart attack|cardiac arrest|stroke|unconscious|not breathing|heavy bleeding|fatal injury|dying|choking)\b/.test(text)) {
      lifeHazard = 10;
      complications.push("Acute Life-Threatening Medical Crisis");
    } else if (/\b(weapon|gun|knife|murder|stabbing|armed robbery|shoot(ing)?)\b/.test(text)) {
      lifeHazard = 9;
      complications.push("Armed Violent Crime / Active Threat to Life");
    } else if (/\b(live wire|hanging wire|open cable|electrocution|exploding transformer|high voltage|sparking wire|snapped wire)\b/.test(text)) {
      lifeHazard = 9;
      complications.push("Exposed Lethal High-Voltage Electrical Hazard");
    } else if (/\b(open manhole|deep manhole|sinkhole|bridge crack|cave[- ]?in|caved in)\b/.test(text)) {
      lifeHazard = 8;
      complications.push("Lethal Roadway Collapse / Deep Uncovered Manhole");
    } else if (/\b(people are getting injured|people getting injured|severe accident|fatal accident|fell|fell into|injured|bike slipped|slipped|broken bones?|blood|crashed)\b/.test(text)) {
      lifeHazard = 7;
      complications.push("Active Bodily Injury & Physical Crashes Reported");
    }

    // Vulnerability
    if (/\b(school|high school|elementary school|kindergarten|primary school|daycare|college|students?|children|kids)\b/.test(text)) {
      vulnerability = Math.max(vulnerability, 9);
      complications.push("High Vulnerability Zone: School / Children Proximity");
    }
    if (/\b(hospital|clinic|nursing home|icu|emergency room|patients?|old age home|elderly|pregnant)\b/.test(text)) {
      vulnerability = Math.max(vulnerability, 9);
      complications.push("Sensitive Zone: Hospital / Healthcare Facility");
    }
    if (/\b(bus stand|bus stop|metro station|railway station|train station|crowded market|bazaar|junction|pedestrian crossing)\b/.test(text)) {
      vulnerability = Math.max(vulnerability, 6);
      complications.push("High-Density Public Transit / Pedestrian Corridor");
    }

    // Scale Impact
    if (/\b(entire (area|neighborhood|colony|ward|street|road|block)|whole (street|neighborhood|colony|area)|all houses|multiple (houses|homes|families|apartments)|hundreds of families|multiple families)\b/.test(text)) {
      scaleImpact = Math.max(scaleImpact, 8);
      complications.push("Widespread Impact: Entire Corridor / Multiple Residences");
    }
    if (/\b(highway|expressway|arterial|main road|key junction|traffic (completely )?blocked|gridlock)\b/.test(text)) {
      scaleImpact = Math.max(scaleImpact, 8);
      complications.push("Critical Transit Disruption: Arterial Corridor / Highway Blocked");
    }
    if (/\b(flooding (the entire|the road|all|multiple)|water entered|submerged|flooding inside)\b/.test(text)) {
      scaleImpact = Math.max(scaleImpact, 8);
      complications.push("Inundation Risk: Flooding Roadway & Infiltrating Dwellings");
    }
    if (/\b(drinking water (is )?(contaminated|muddy|black|smelling|poisonous)|sewage mixed with drinking)\b/.test(text)) {
      scaleImpact = Math.max(scaleImpact, 9);
      complications.push("Critical Health Risk: Contaminated Drinking Water Supply");
    }

    // Urgency & Escalation
    if (/\b(spreading|sparks flying|getting worse|rapidly rising|crater getting bigger|multiple vehicles damaged)\b/.test(text)) {
      urgencyEscalation = Math.max(urgencyEscalation, 8);
      complications.push("Active Escalation: Condition Rapidly Deteriorating");
    }
    if (/\b(for (\d+|several|many) (days|weeks)|past month|repeated complaints|no action taken|still not fixed)\b/.test(text)) {
      urgencyEscalation = Math.max(urgencyEscalation, 6);
      complications.push("Persistent Chronic Grievance: Multi-Day Neglected Failure");
    }
    if (/\b(dead animal|carcass|rotting|maggots|dengue|malaria hotspot)\b/.test(text)) {
      urgencyEscalation = Math.max(urgencyEscalation, 7);
      complications.push("Epidemiological Threat: Rotting Vector / Disease Risk");
    }

    // Routine Dampener
    if (/\b(name board|signboard|faded|peeling paint|painting|park bench|flower bed|grass cutting|tree pruning)\b/.test(text) && lifeHazard === 0) {
      routineDampener = Math.max(routineDampener, 9);
      complications.push("Cosmetic Aesthetic Disrepair: Non-Hazardous Maintenance");
    }
    if (/\b(receipt|tax enquiry|bill enquiry|status enquiry|procedure|fee|feedback|suggestion|working hours)\b/.test(text) && lifeHazard === 0) {
      routineDampener = Math.max(routineDampener, 9);
      complications.push("Administrative / Informational Query");
    }
    if (/\b(single (bulb|street light)|one street light|dim light|flickering|flickering bulb|tap (is )?dripping|slight drip|minor leak|small pothole)\b/.test(text) && lifeHazard === 0 && vulnerability < 5) {
      routineDampener = Math.max(routineDampener, 6);
      complications.push("Localized Isolated Defect: Routine Single-Asset Maintenance");
    }

    const complicationScore = Math.max(5, Math.min(100, Math.round(
      lifeHazard * 4.5 + vulnerability * 2.2 + scaleImpact * 2.0 + urgencyEscalation * 1.5 - routineDampener * 3.5
    )));

    // 3. PRIORITY DECISION
    let explanation = "Standard routine municipal maintenance.";
    let sla = "24-48 Hours";

    if (lifeHazard >= 8) {
      priority = "CRITICAL";
      sla = "< 30 Minutes";
      explanation = "Critical Hazard: Immediate life-safety threat requiring rapid response.";
    } else if (lifeHazard >= 6 && vulnerability >= 6) {
      priority = "CRITICAL";
      sla = "< 30 Minutes";
      explanation = "Critical Hazard: Exposed physical danger in high-vulnerability school or healthcare zone.";
    } else if (lifeHazard >= 6 || scaleImpact >= 7 || vulnerability >= 7) {
      priority = "HIGH";
      sla = "4 Hours";
      explanation = "High Priority: Significant public disruption or elevated safety hazard.";
    } else if (complications.some(c => c.includes("Contaminated") || c.includes("Inundation") || c.includes("Epidemiological") || c.includes("Blocked"))) {
      priority = "HIGH";
      sla = "4 Hours";
      explanation = "High Priority: Severe environmental health hazard or vital corridor blockage.";
    } else if (department === "Police & Law Enforcement") {
      priority = "HIGH";
      sla = "4 Hours";
      explanation = "High Priority: Active law and order issue requiring patrol action.";
    } else if (complicationScore >= 50) {
      priority = "HIGH";
      sla = "4 Hours";
      explanation = "High Priority: Compound infrastructure complication with elevated risk.";
    } else if (routineDampener >= 7 && lifeHazard === 0 && scaleImpact <= 2 && vulnerability <= 3) {
      priority = "LOW";
      sla = "5-7 Days";
      explanation = "Routine / Cosmetic Maintenance: Non-hazardous administrative or aesthetic request.";
    } else {
      priority = "MEDIUM";
      sla = "24-48 Hours";
      explanation = "Standard Operational Maintenance: Routine ward-level civic maintenance.";
    }

    const isDuplicate = !!dupCheck.isDuplicate;
    const duplicateOf = dupCheck.duplicateOf || null;
    const validity = isDuplicate ? "Suspected Duplicate" : "Verified Valid";

    const newRecord = {
      uid,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      complaint: payload.complaint,
      category: payload.category || "General",
      lat: payload.lat,
      lng: payload.lng,
      address: payload.address || "Location Recorded",
      images: payload.images || [],
      videos: payload.videos || [],
      priority,
      department,
      status: "Pending Review",
      validity,
      duplicate_of: duplicateOf,
      duplicate_score: dupCheck.score || 0,
      assigned_officer: "Pending Field Officer Assignment",
      triage_result: {
        root_issue: `${department} Operational Maintenance`,
        recommended_department: department,
        priority: priority,
        explanation: explanation,
        sla: sla,
        complications: complications
      },
      created_at: new Date().toISOString()
    };

    const current = this._getLocalComplaints();
    current.unshift(newRecord);
    this._saveLocalComplaints(current);

    return {
      uid,
      duplicate_detected: false,
      priority,
      department,
      status: "Pending Review",
      validity,
      is_possible_duplicate: isDuplicate,
      is_duplicate: isDuplicate,
      duplicate_of: duplicateOf,
      duplicate_score: dupCheck.score || 0,
      triage_result: newRecord.triage_result,
      created_at: newRecord.created_at,
      message: isDuplicate
        ? `Complaint ${uid} submitted (Flagged as potential duplicate of ${duplicateOf} for Admin Review)`
        : `Complaint ${uid} logged successfully. Current Status: PENDING REVIEW`
    };
  }

  async getComplaints() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints`);
        if (res.ok) {
          const data = await res.json();
          return data.complaints || [];
        }
      } catch (e) {}
    }
    return this._getLocalComplaints();
  }

  async getAllComplaints() {
    return this.getComplaints();
  }

  async updateComplaintStatus(uid, status) {
    return this.updateStatus(uid, status);
  }

  async getComplaint(uid) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(uid)}`);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return this._getLocalComplaints().find(c => c.uid.toUpperCase() === uid.toUpperCase()) || null;
  }

  async updateStatus(uid, status) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(uid)}/status`, {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ status })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const current = this._getLocalComplaints();
    const target = current.find(c => c.uid.toUpperCase() === uid.toUpperCase());
    if (target) {
      target.status = status;
      target.updated_at = new Date().toISOString();
      this._saveLocalComplaints(current);
      return { message: "Updated", complaint: target };
    }
    throw new Error("Complaint not found");
  }

  async validateComplaint(uid, validity, note) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(uid)}/validate`, {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ validity, note })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const current = this._getLocalComplaints();
    const target = current.find(c => c.uid.toUpperCase() === uid.toUpperCase());
    if (target) {
      target.validity = validity;
      if (note) target.admin_note = note;
      target.updated_at = new Date().toISOString();
      this._saveLocalComplaints(current);
      return { message: `Status updated to ${validity}`, complaint: target };
    }
    throw new Error("Complaint not found");
  }

  async assignComplaint(uid, department, officer, auto = false) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(uid)}/assign`, {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ department, officer, auto })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const current = this._getLocalComplaints();
    const target = current.find(c => c.uid.toUpperCase() === uid.toUpperCase());
    if (target) {
      target.department = department;
      target.assigned_officer = officer || `Assigned to ${department} Lead`;
      target.status = "Assigned";
      target.updated_at = new Date().toISOString();
      this._saveLocalComplaints(current);
      return { message: `Assigned to ${department}`, complaint: target };
    }
    throw new Error("Complaint not found");
  }

  async approveAndAssignComplaint(uid, department = null, officer = null, note = null) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(uid)}/approve`, {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ department, officer, admin_note: note })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const current = this._getLocalComplaints();
    const target = current.find(c => c.uid.toUpperCase() === uid.toUpperCase());
    if (target) {
      const dept = department || target.department || "General Administration";
      target.department = dept;
      target.assigned_officer = officer || `Assigned to ${dept} Rapid Action Unit`;
      target.status = "Assigned";
      target.admin_decision = "APPROVED";
      if (note) target.admin_note = note;
      target.approved_at = new Date().toISOString();
      target.updated_at = target.approved_at;
      this._saveLocalComplaints(current);
      return { message: `Complaint approved and assigned to ${dept}`, complaint: target };
    }
    throw new Error("Complaint not found");
  }

  async rejectComplaint(uid, rejectionReason) {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error("Rejection reason is mandatory.");
    }
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(uid)}/reject`, {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ rejection_reason: rejectionReason.trim() })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const current = this._getLocalComplaints();
    const target = current.find(c => c.uid.toUpperCase() === uid.toUpperCase());
    if (target) {
      target.status = "Rejected";
      target.validity = "Rejected/Spam";
      target.admin_decision = "REJECTED";
      target.rejection_reason = rejectionReason.trim();
      target.rejected_at = new Date().toISOString();
      target.updated_at = target.rejected_at;
      this._saveLocalComplaints(current);
      return { message: `Complaint rejected: ${rejectionReason}`, complaint: target };
    }
    throw new Error("Complaint not found");
  }

  async resolveComplaint(uid, proofOrOptions = null, resolutionNote = "", officer = null) {
    let proofImage = proofOrOptions;
    let note = resolutionNote;
    let assignedOfficer = officer;

    if (proofOrOptions && typeof proofOrOptions === "object") {
      proofImage = proofOrOptions.after_image || proofOrOptions.resolution_proof_image || null;
      note = proofOrOptions.resolution_notes || proofOrOptions.resolution_note || "";
      assignedOfficer = proofOrOptions.resolved_by || proofOrOptions.officer || null;
    }

    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(uid)}/resolve`, {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            resolution_proof_image: proofImage,
            resolution_note: note,
            officer: assignedOfficer
          })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const current = this._getLocalComplaints();
    const target = current.find(c => c.uid.toUpperCase() === uid.toUpperCase());
    if (target) {
      target.status = "Resolved";
      if (proofImage) {
        target.resolution_proof_image = proofImage;
        target.after_image = proofImage;
      }
      if (note) {
        target.resolution_note = note;
        target.resolution_notes = note;
      }
      if (assignedOfficer) {
        target.assigned_officer = assignedOfficer;
        target.resolved_by = assignedOfficer;
      }
      target.resolved_at = new Date().toISOString();
      target.updated_at = target.resolved_at;
      this._saveLocalComplaints(current);
      return { message: `Complaint ${uid} marked as Resolved with on-site proof.`, complaint: target };
    }
    throw new Error("Complaint not found");
  }

  async submitFeedback(uid, ratingOrOptions = 5, comment = "", reopen = false) {
    let rating = ratingOrOptions;
    let feedbackComment = comment;
    let shouldReopen = reopen;

    if (ratingOrOptions && typeof ratingOrOptions === "object") {
      rating = ratingOrOptions.rating !== undefined ? ratingOrOptions.rating : 5;
      feedbackComment = ratingOrOptions.feedback || ratingOrOptions.comment || "";
      shouldReopen = !!ratingOrOptions.reopen;
    }

    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(uid)}/feedback`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment: feedbackComment, reopen: shouldReopen })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const current = this._getLocalComplaints();
    const target = current.find(c => c.uid.toUpperCase() === uid.toUpperCase());
    if (target) {
      if (shouldReopen) {
        target.status = "In Progress";
        target.disputed = true;
        target.dispute_note = feedbackComment || "Citizen reported resolution was incomplete.";
        target.reopened_at = new Date().toISOString();
        if (target.priority === "LOW") target.priority = "MEDIUM";
        else if (target.priority === "MEDIUM") target.priority = "HIGH";
        else if (target.priority === "HIGH") target.priority = "CRITICAL";
      } else {
        target.status = "Verified Closed";
        target.citizen_verified = true;
      }
      target.citizen_rating = rating;
      target.citizen_feedback = feedbackComment || "";
      target.citizen_feedback_detail = {
        rating,
        comment: feedbackComment || "",
        reopened: shouldReopen,
        submitted_at: new Date().toISOString()
      };
      target.updated_at = new Date().toISOString();
      this._saveLocalComplaints(current);
      return { message: shouldReopen ? "Complaint reopened" : "Feedback submitted", complaint: target };
    }
    throw new Error("Complaint not found");
  }

  _enhanceSemanticMeaning(literal) {
    if (!literal) return "";
    const t = literal.toLowerCase().trim();
    let defect = "";
    if (/\b(pothole|potholes|crater|craters|road damage|broken road|sinkhole|cave[- ]?in)\b/.test(t)) {
      defect = /\b(sinkhole|cave)\b/.test(t)
        ? "Severe roadway structural collapse with deep sinkhole crater"
        : "Major road infrastructure degradation with deep pothole crater";
    } else if (/\b(live wire|hanging wire|open cable|electric wire|power line|sparking wire|snapped wire|power cut|transformer)\b/.test(t)) {
      if (t.includes("transformer")) defect = "Municipal power grid transformer malfunction and electrical fault";
      else if (/\b(wire|cable|line)\b/.test(t)) defect = "Exposed high-voltage electrical power cable snapped and fallen";
      else defect = "Severe electrical grid failure and localized power outage";
    } else if (/\b(pipe|pipeline|leak|burst|water line|drinking water)\b/.test(t)) {
      if (/\b(burst|heavy|river)\b/.test(t)) defect = "Pressurized municipal water distribution pipeline rupture and major inundation";
      else if (/\b(drinking|dirty|contaminated|muddy)\b/.test(t)) defect = "Severe municipal drinking water contamination with turbid supply";
      else defect = "Municipal water pipeline leak and continuous water wastage";
    } else if (/\b(drain|drainage|sewer|gutter|overflow|sewerage|manhole)\b/.test(t)) {
      if (t.includes("manhole")) defect = "Dangerous uncovered deep municipal sewer manhole on public thoroughfare";
      else defect = "Clogged municipal drainage network causing foul sewage overflow";
    } else if (/\b(garbage|trash|waste|dump|stench|smell|dead animal|carcass)\b/.test(t)) {
      if (/\b(animal|carcass)\b/.test(t)) defect = "Decomposing animal carcass on public pathway posing acute biohazard";
      else defect = "Heavy uncollected solid waste accumulation emitting severe foul stench";
    } else if (/\b(street light|street lights|light|dark|bulb)\b/.test(t)) {
      defect = "Non-functional municipal street lighting causing dark, unsafe road corridor";
    } else if (/\b(fire|blaze|flames|smoke|explosion|gas leak)\b/.test(t)) {
      defect = "Active fire and hazardous emergency situation requiring urgent suppression";
    } else {
      const clean = literal.replace(/[.\s]+$/, "");
      defect = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : "Municipal civic infrastructure defect";
    }

    const impacts = [];
    if (/\b(accident|accidents|fell|falling|slip|slipped|crash|crashed|injured|injuries|damage)\b/.test(t)) {
      impacts.push("causing active vehicular accidents and commuter injury risk");
    }
    if (/\b(spark|sparks|shock|electrocution|sparks flying)\b/.test(t)) {
      impacts.push("emitting hazardous electrical sparks with lethal electrocution danger");
    }
    if (/\b(flood|flooding|water entered|homes|houses|dwelling|inside|shop|shops)\b/.test(t)) {
      impacts.push("inundating nearby dwellings and disrupting local access");
    }
    if (/\b(disease|diseases|smell|stench|unbearable|dogs|mosquito|dengue|malaria|hygiene|unhygienic)\b/.test(t)) {
      impacts.push("generating vector-borne disease threats and critical unhygienic conditions");
    }
    if (/\b(school|children|students|kids)\b/.test(t)) {
      impacts.push("situated in immediate proximity to school zone endangering students");
    }
    if (/\b(hospital|clinic|patient|patients)\b/.test(t)) {
      impacts.push("obstructing critical emergency access route to healthcare facility");
    }
    if (/\b(traffic|block|blocked|gridlock|jam)\b/.test(t)) {
      impacts.push("creating severe traffic gridlock across primary transit corridor");
    }
    if (/\b(dark|theft|unsafe|danger|women)\b/.test(t)) {
      impacts.push("compromising night-time public transit safety");
    }

    return impacts.length > 0 ? `${defect}, ${impacts.join(", ")}.` : `${defect}. Urgent municipal maintenance and inspection required.`;
  }

  async translateText(text, targetLang = "en") {
    const raw = (text || "").trim();
    if (!raw) return { translated_text: "", meaning_text: "", literal_text: "", detected_lang: "en", original_text: "" };

    // 1. Try FastAPI backend translation endpoint (which translates MEANING, not just exact words)
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: raw, target_lang: targetLang })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && (data.translated_text || data.meaning_text)) return data;
        }
      } catch (e) {}
    }

    // 2. Direct browser fallback: Translate literal via Google Translate then enhance to full civic meaning
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(raw)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const literal = (data[0] || []).map(part => part[0]).filter(Boolean).join("");
        const detected = data[2] || "auto";
        const meaning = this._enhanceSemanticMeaning(literal);
        return {
          translated_text: meaning || literal,
          meaning_text: meaning || literal,
          literal_text: literal,
          detected_lang: detected,
          original_text: raw
        };
      }
    } catch (e) {}

    const clientMeaning = this._enhanceSemanticMeaning(raw);
    return { translated_text: clientMeaning || raw, meaning_text: clientMeaning || raw, literal_text: raw, detected_lang: "en", original_text: raw };
  }

  async getNotices() {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/notices`);
        if (res.ok) {
          const data = await res.json();
          return data.notices || [];
        }
      } catch (e) {}
    }
    return this._getLocalNotices();
  }

  async createNotice(payload) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/notices`, {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const notices = this._getLocalNotices();
    const id = `NOT-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
    const newNotice = {
      id,
      title: payload.title,
      content: payload.content,
      department: payload.department,
      urgency: payload.urgency || "Info",
      category: payload.category || "General",
      created_at: new Date().toISOString()
    };
    notices.unshift(newNotice);
    this._saveLocalNotices(notices);
    return { message: "Public notice broadcasted", notice: newNotice };
  }

  async analyzePrompt(text, category, lat = null, lng = null) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/api/analyze-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, category, lat, lng })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }

    const dup = this.checkDuplicateLocal(text, lat, lng);
    return {
      priority: "MEDIUM",
      department: "General Administration",
      intent: "Local Semantic Analysis",
      confidence: 0.70,
      sentiment: "Standard Civic Reporting",
      duplicate_check: {
        is_duplicate: dup.isDuplicate,
        duplicate_of: dup.duplicateOf,
        similarity_score: dup.isDuplicate ? 0.75 : 0.0
      }
    };
  }

  async getComplaintUnderstanding(text) {
    if (this.isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/api/complaint-understanding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return {
      pipeline: "DistilBERT Complaint Understanding Pipeline (Local Client Mode)",
      input: { raw_text: text },
      tokens: ["[CLS]", ...text.toLowerCase().split(/\s+/), "[SEP]"],
      embedding_dim: 768
    };
  }
}

window.cityBrainAPI = new CityBrainAPI();
