"""
CityBrain Intelligent Priority & Municipal Department Classification Engine
=============================================================================
Context-Aware Entity, Complication & Impact Analysis:
1. Root Problem Comprehension: Identifies the responsible municipal authority based
   on the core infrastructure/civic asset (PWD, Water, Electricity, Sanitation, Police, etc.),
   never confusing incidental injury mentions with ambulance dispatch.
2. Multi-Factor Complication Analysis: Evaluates 5 dimensions of real-world complications:
   - Life Hazard & Bodily Harm (Active fires, collapses, gas leaks, live wires, cardiac crises)
   - Vulnerable Location Multipliers (Schools, hospitals, elderly homes, transit hubs)
   - Scale & Area Magnitude (Entire neighborhood, arterial highway, flooding homes)
   - Urgency Escalation & Persistence (Active worsening, recurrent accidents, days unaddressed)
   - Routine & Cosmetic Dampeners (Single bulb, minor drip, paint, billing/info inquiries)
3. Calibrated Priority Decision:
   CRITICAL | HIGH | MEDIUM | LOW with explainable rationale and dispatch SLA.
"""

import re
from typing import Dict, List, Tuple, Optional, Any

# Domain Routing Taxonomies
CATEGORY_TO_DEPT = {
    "roads": "Public Works Department (PWD)",
    "water": "Water Supply & Sewerage Board",
    "electricity": "Electricity & Power Board",
    "sanitation": "Public Health & Sanitation Department",
    "ambulance": "Emergency Healthcare & Ambulance Services",
    "police": "Police & Law Enforcement",
    "emergency": "Fire & Rescue Services",
    "general": "General Administration"
}

DEPT_INTENTS = {
    "Fire & Rescue Services": "Disaster & Fire Rescue Emergency",
    "Emergency Healthcare & Ambulance Services": "Acute Medical Life-Risk & Healthcare Dispatch",
    "Police & Law Enforcement": "Public Safety & Law Enforcement Threat",
    "Electricity & Power Board": "Electrical Grid & Power Infrastructure",
    "Public Works Department (PWD)": "Roads, Bridges & Civil Infrastructure (PWD)",
    "Water Supply & Sewerage Board": "Water Supply Distribution & Sewerage Network",
    "Public Health & Sanitation Department": "Public Health, Sanitation & Solid Waste Management",
    "Public Transport & Transit Authority": "Public Transit & Fleet Operations",
    "General Administration": "Municipal Administration & Civic Governance"
}


class IntelligentPriorityEngine:
    """
    Intelligent Priority & Department Classification Engine.
    Accurately understands the root problem and its complications before deciding priority.
    """

    def classify_department(self, text: str, category: Optional[str] = None) -> Tuple[str, float]:
        """
        Determines the correct municipal department responsible for addressing the root problem.
        Returns (Department_Name, Confidence_Score).
        """
        t = (text or "").lower()
        cat = (category or "").lower().strip()

        # 1. FIRE, DISASTER & STRUCTURAL COLLAPSE
        if re.search(r"\b(fire|flames?|blaze|explosion|blast|gas leak|cylinder leak|cylinder blast|building collaps\w*|wall collaps\w*|bridge collaps\w*|landslide|drowning|drowned)\b", t):
            return "Fire & Rescue Services", 0.98

        # 2. ELECTRICITY, POWER & HIGH VOLTAGE
        if re.search(r"\b(electric\w*|power|transformer|live wire|hanging wire|open cable|high voltage|short circuit|blackout|voltage|street lights?|electric pole|electrocution|sparks?|sparking|power cut|load shedding|meter box)\b", t):
            return "Electricity & Power Board", 0.95

        # 3. WATER SUPPLY & SEWERAGE
        if re.search(r"\b(water|pipe(line)?|leak\w*|burst|taps?|sewers?|sewerage|drains?|drainage|gutters?|flooding|muddy water|dirty water|no water|water supply|drinking water|borewell|water tank)\b", t):
            return "Water Supply & Sewerage Board", 0.95

        # 4. ROADS & INFRASTRUCTURE (PWD)
        if re.search(r"\b(roads?|potholes?|traffic|signals?|traffic light|bridges?|flyovers?|footpaths?|sidewalks?|manholes?|sinkholes?|craters?|tar|asphalt|pavement|cave[- ]?in|caved in|road divider)\b", t):
            return "Public Works Department (PWD)", 0.95

        # 5. SANITATION & SOLID WASTE
        if re.search(r"\b(garbage|trash|waste|dumps?|dumping|dustbins?|stench|smell|foul|filth|dead animal|carcass|sanitation|sweeper|litter|debris|drain smell|unhygienic)\b", t):
            return "Public Health & Sanitation Department", 0.94

        # 6. POLICE, CRIME & PUBLIC SAFETY
        if re.search(r"\b(police|theft|thief|robber\w*|burglary|assault|fight|violence|harass\w*|stolen|eve[- ]teasing|drugs?|weapon|murder|gunshot|stabbing|knife|gang|crime|illegal|threat|rowdies)\b", t):
            return "Police & Law Enforcement", 0.94

        # 7. MEDICAL & AMBULANCE (When primary intent is medical rescue or clinical transport)
        if re.search(r"\b(ambulance|hospital|patient|doctor|clinic|medic(al|ine)?|paramedic|healthcare|icu|first aid|casualty|dengue|malaria|maternity)\b", t):
            return "Emergency Healthcare & Ambulance Services", 0.92

        # 8. PUBLIC TRANSPORT & TRANSIT
        if re.search(r"\b(buses?|metro|transit|trains?|bus stop|auto rickshaw|bus fare|depot)\b", t):
            return "Public Transport & Transit Authority", 0.90

        # 9. CATEGORY FALLBACK
        if cat in CATEGORY_TO_DEPT:
            return CATEGORY_TO_DEPT[cat], 0.85
        for key, dept in CATEGORY_TO_DEPT.items():
            if key in cat:
                return dept, 0.85

        return "General Administration", 0.65

    def identify_root_civic_asset(self, text: str, department: str) -> str:
        """Identifies the primary physical infrastructure asset or civic subject."""
        t = (text or "").lower()
        if re.search(r"\b(open manhole|deep manhole|sinkhole|cave[- ]?in)\b", t):
            return "Severe Roadway Structural Hazard (Open Manhole / Sinkhole)"
        if re.search(r"\b(potholes?|craters?|road damage|broken road|tar|asphalt)\b", t):
            return "Road Infrastructure Disrepair (Pothole / Crater)"
        if re.search(r"\b(bridges?|flyovers?)\b", t):
            return "Major Civil Structure (Bridge / Flyover Disrepair)"
        if re.search(r"\b(signals?|traffic light)\b", t):
            return "Traffic Regulation Asset (Signal / Light Failure)"
        if re.search(r"\b(footpaths?|sidewalks?)\b", t):
            return "Pedestrian Infrastructure (Damaged Footpath)"
        if re.search(r"\b(live wire|hanging wire|open cable|high voltage|sparking wire|snapped wire|wire snapped|electric wire)\b", t):
            return "High-Voltage Lethal Wire Hazard"
        if re.search(r"\b(transformers?|exploding transformer|sparking transformer)\b", t):
            return "Power Grid Transformer Malfunction"
        if re.search(r"\b(street lights?|bulb)\b", t):
            return "Municipal Street Lighting Asset"
        if re.search(r"\b(blackout|power cut|load shedding)\b", t):
            return "Area Grid Power Outage"
        if re.search(r"\b(pipe(line)?|burst pipe|water leak|pipe burst|main burst)\b", t):
            return "Water Distribution Pipeline Rupture"
        if re.search(r"\b(sewers?|sewerage|drains?|drainage|gutters?)\b", t):
            return "Sewerage & Drainage Network Choke / Overflow"
        if re.search(r"\b(drinking water|dirty water|muddy water|contaminated)\b", t):
            return "Drinking Water Contamination Hazard"
        if re.search(r"\b(no water|low pressure|water pressure)\b", t):
            return "Municipal Water Supply Scarcity"
        if re.search(r"\b(dead animal|carcass)\b", t):
            return "Public Health Hazard (Animal Carcass)"
        if re.search(r"\b(garbage|trash|waste|dumps?|dustbins?)\b", t):
            return "Solid Waste Accumulation & Sanitation Hazard"
        if re.search(r"\b(fire|flames?|blaze|explosion|gas leak)\b", t):
            return "Active Fire / Explosion / Disaster Hazard"
        if re.search(r"\b(cardiac|heart attack|stroke|ambulance|unconscious)\b", t):
            return "Emergency Healthcare / Critical Patient Transport"
        if re.search(r"\b(theft|burglary|robbery|assault|crime)\b", t):
            return "Law & Order Infraction / Public Safety Threat"

        return f"{department} Operational Maintenance"

    def analyze_complications(self, text: str, department: str) -> Dict[str, Any]:
        """
        Deep multi-factor complication analysis:
        1. Life Hazard & Bodily Danger (0-10)
        2. Vulnerable Locations & Demographic Sensitivity (0-10)
        3. Impact Scale & Geographic Disruption (0-10)
        4. Urgency & Worsening Escalation (0-10)
        5. Routine / Cosmetic / Administrative Dampener (0-10)
        """
        t = (text or "").lower()

        detected_complications: List[str] = []
        life_hazard = 0
        vulnerability = 0
        scale_impact = 0
        urgency_escalation = 0
        routine_dampener = 0

        # --- Dimension 1: Life Hazard & Bodily Danger ---
        if re.search(r"\b(fire|flames?|blaze|explosion|blast|gas leak|cylinder blast|building collaps\w*|wall collaps\w*|drowning|people trapped|trapped inside)\b", t):
            life_hazard = 10
            detected_complications.append("Active Disaster / Physical Collapse / Casualty Risk")
        elif re.search(r"\b(heart attack|cardiac arrest|stroke|unconscious|not breathing|heavy bleeding|fatal injury|dying|choking)\b", t):
            life_hazard = 10
            detected_complications.append("Acute Life-Threatening Medical Crisis")
        elif re.search(r"\b(weapon|gun|knife|murder|stabbing|armed robbery|shoot(ing)?)\b", t):
            life_hazard = 9
            detected_complications.append("Armed Violent Crime / Active Threat to Life")
        elif re.search(r"\b(live wire|hanging wire|open cable|electrocution|exploding transformer|high voltage|sparking wire|snapped wire)\b", t):
            life_hazard = 9
            detected_complications.append("Exposed Lethal High-Voltage Electrical Hazard")
        elif re.search(r"\b(open manhole|deep manhole|sinkhole|bridge crack|cave[- ]?in|caved in)\b", t):
            life_hazard = 8
            detected_complications.append("Lethal Roadway Collapse / Deep Uncovered Manhole")
        elif re.search(r"\b(people are getting injured|people getting injured|severe accident|fatal accident|fell|fell into|injured|bike slipped|slipped|broken bones?|blood|crashed)\b", t):
            life_hazard = 7
            detected_complications.append("Active Bodily Injury & Physical Accidents Reported")

        # --- Dimension 2: Vulnerable Location & Demographics ---
        if re.search(r"\b(school|high school|elementary school|kindergarten|primary school|daycare|college|students?|children|kids)\b", t):
            vulnerability = max(vulnerability, 9)
            detected_complications.append("High Vulnerability Zone: School / Children Proximity")
        if re.search(r"\b(hospital|clinic|nursing home|icu|emergency room|patients?|old age home|elderly|pregnant)\b", t):
            vulnerability = max(vulnerability, 9)
            detected_complications.append("Sensitive Zone: Hospital / Patient / Healthcare Facility")
        if re.search(r"\b(bus stand|bus stop|metro station|railway station|train station|crowded market|bazaar|junction|pedestrian crossing)\b", t):
            vulnerability = max(vulnerability, 6)
            detected_complications.append("High-Density Public Transit / Pedestrian Corridor")

        # --- Dimension 3: Scale & Geographic Disruption ---
        if re.search(r"\b(entire (area|neighborhood|colony|ward|street|road|block)|whole (street|neighborhood|colony|area)|all houses|multiple (houses|homes|families|apartments)|hundreds of families|multiple families)\b", t):
            scale_impact = max(scale_impact, 8)
            detected_complications.append("Widespread Impact: Entire Corridor / Multiple Residences Affected")
        if re.search(r"\b(highway|expressway|arterial|main road|key junction|traffic (completely )?blocked|gridlock)\b", t):
            scale_impact = max(scale_impact, 8)
            detected_complications.append("Critical Transit Disruption: Arterial Corridor / Highway Blocked")
        if re.search(r"\b(flooding|flood|submerged|houses|homes)\b", t):
            if re.search(r"\b(flooding (the entire|the road|all|multiple)|water entered|submerged|flooding inside)\b", t):
                scale_impact = max(scale_impact, 8)
                detected_complications.append("Inundation Risk: Flooding Roadway & Infiltrating Dwellings")
        if re.search(r"\b(drinking water (is )?(contaminated|muddy|black|smelling|poisonous)|sewage mixed with drinking)\b", t):
            scale_impact = max(scale_impact, 9)
            detected_complications.append("Critical Health Risk: Contaminated Drinking Water Supply")

        # --- Dimension 4: Urgency & Escalation ---
        if re.search(r"\b(spreading|sparks flying|getting worse|rapidly rising|crater getting bigger|multiple vehicles damaged)\b", t):
            urgency_escalation = max(urgency_escalation, 8)
            detected_complications.append("Active Escalation: Condition Rapidly Deteriorating")
        if re.search(r"\b(for (\d+|several|many) (days|weeks)|past month|repeated complaints|no action taken|still not fixed)\b", t):
            urgency_escalation = max(urgency_escalation, 6)
            detected_complications.append("Persistent Chronic Grievance: Multi-Day Neglected Failure")
        if re.search(r"\b(dead animal|carcass|rotting|maggots|dengue|malaria hotspot)\b", t):
            urgency_escalation = max(urgency_escalation, 7)
            detected_complications.append("Epidemiological Threat: Rotting Vector / Disease Risk")

        # --- Dimension 5: Routine / Cosmetic / Administrative Dampeners ---
        if re.search(r"\b(name board|signboard|faded|peeling paint|painting|park bench|flower bed|grass cutting|tree pruning)\b", t) and life_hazard == 0:
            routine_dampener = max(routine_dampener, 9)
            detected_complications.append("Cosmetic Aesthetic Disrepair: Non-Hazardous Maintenance")
        if re.search(r"\b(receipt|tax enquiry|bill enquiry|status enquiry|procedure|fee|feedback|suggestion|working hours)\b", t) and life_hazard == 0:
            routine_dampener = max(routine_dampener, 9)
            detected_complications.append("Administrative / Informational Query")
        if re.search(r"\b(single (bulb|street light)|one street light|dim light|flickering|flickering bulb|tap (is )?dripping|slight drip|minor leak|small pothole)\b", t) and life_hazard == 0 and vulnerability < 5:
            routine_dampener = max(routine_dampener, 6)
            detected_complications.append("Localized Isolated Defect: Routine Single-Asset Maintenance")

        # Aggregate Complication Score (0 - 100)
        raw_score = (
            life_hazard * 4.5 +
            vulnerability * 2.2 +
            scale_impact * 2.0 +
            urgency_escalation * 1.5 -
            routine_dampener * 3.5
        )
        final_score = int(max(5, min(100, round(raw_score))))

        return {
            "score": final_score,
            "life_hazard": life_hazard,
            "vulnerability": vulnerability,
            "scale_impact": scale_impact,
            "urgency_escalation": urgency_escalation,
            "routine_dampener": routine_dampener,
            "detected": detected_complications
        }

    def assess_priority(self, text: str, department: str) -> Tuple[str, str, Dict[str, Any]]:
        """
        Synthesizes the problem understanding and complication analysis into an actionable priority:
        CRITICAL | HIGH | MEDIUM | LOW.
        Returns (Priority, Decision_Reason, Complications_Dict).
        """
        complications = self.analyze_complications(text, department)
        life_h = complications["life_hazard"]
        vuln = complications["vulnerability"]
        scale = complications["scale_impact"]
        damp = complications["routine_dampener"]
        comp_score = complications["score"]

        # ---------------- LEVEL 1: CRITICAL (Imminent Hazard / Active Life Risk) ----------------
        if life_h >= 8:
            reasons = [c for c in complications["detected"] if any(k in c for k in ["Lethal", "Disaster", "Medical", "Armed", "Casualty"])]
            reason_text = reasons[0] if reasons else "Imminent active threat to life and public safety"
            return "CRITICAL", f"Critical Hazard: {reason_text}", complications

        if life_h >= 6 and vuln >= 6:
            return "CRITICAL", "Critical Hazard: Exposed physical danger in high-vulnerability school or hospital zone", complications

        if life_h >= 6 and scale >= 7:
            return "CRITICAL", "Critical Hazard: Severe compound hazard with widespread public endangerment", complications

        # ---------------- LEVEL 2: HIGH (Major Disruption / Severe Public Hazard) ----------------
        if life_h >= 6:
            return "HIGH", "High Priority: Recurrent injury risk or physical trauma reported", complications

        if scale >= 7:
            return "HIGH", "High Priority: Extensive public impact across entire neighborhood or arterial corridor", complications

        if vuln >= 7:
            return "HIGH", "High Priority: Infrastructure disrepair directly compromising school or healthcare access", complications

        if any(any(k in c for k in ["Contaminated", "Inundation", "Epidemiological", "Blocked"]) for c in complications["detected"]):
            return "HIGH", "High Priority: Severe environmental health hazard or vital corridor blockage", complications

        if department in ["Police & Law Enforcement"]:
            return "HIGH", "High Priority: Active law and order infraction requiring police intervention", complications

        if comp_score >= 50:
            return "HIGH", "High Priority: Compound infrastructure complication with elevated public risk", complications

        # ---------------- LEVEL 4: LOW (Cosmetic Disrepair / General Inquiries) ----------------
        if damp >= 7 and life_h == 0 and scale <= 2 and vuln <= 3:
            if any("Administrative" in c for c in complications["detected"]):
                return "LOW", "Routine Inquiry: Administrative query or public information request", complications
            return "LOW", "Cosmetic Maintenance: Non-hazardous aesthetic repair or minor park upkeep", complications

        # ---------------- LEVEL 3: MEDIUM (Standard Routine Maintenance) ----------------
        # Standard default when there is no life risk and no high complication
        return "MEDIUM", "Standard Operational Maintenance: Routine ward-level civic maintenance", complications

    def analyze(self, text: str, category: Optional[str] = None) -> Dict[str, Any]:
        """
        AI Triage Engine (Steps 1 -> 5):
        STEP 1 -> Complaint Understanding & Semantic Extraction
        STEP 2 -> Root Civic Asset & Problem Identification
        STEP 3 -> Municipal Department Routing
        STEP 4 -> Complication & Contextual Severity Assessment
        STEP 5 -> Priority Decision with Operational SLA
        """
        clean_text = (text or "").strip()
        if not clean_text:
            return {
                "root_issue": "Awaiting Incident Details",
                "recommended_department": "General Administration",
                "priority": "MEDIUM",
                "explanation": "No text provided for evaluation.",
                "status": "PENDING REVIEW",
                "department": "General Administration",
                "intent": "Awaiting Incident Details",
                "confidence": 0.0,
                "reason": "No text provided",
                "sla": "Standard Queue",
                "complications": {
                    "score": 0,
                    "detected": ["Awaiting input"]
                },
                "recommendation": "Enter incident details to trigger automated municipal triage."
            }

        # Step 1, 2, 3: Department Recommendation & Root Civic Asset
        department, confidence = self.classify_department(clean_text, category)
        root_asset = self.identify_root_civic_asset(clean_text, department)

        # Step 4 & 5: Complication Analysis & Priority Decision
        priority, reason, complications = self.assess_priority(clean_text, department)
        intent = DEPT_INTENTS.get(department, "Municipal Service Routing")

        # Tailored SLA and dispatch recommendations
        if priority == "CRITICAL":
            sla = "< 30 Minutes"
            recommendation = f"Immediate Emergency Dispatch: Alert {department} Rapid Action Team with {sla} SLA. {reason}."
        elif priority == "HIGH":
            sla = "4 Hours"
            recommendation = f"High-Priority Work Order: Route ticket to {department} field division with {sla} SLA. {reason}."
        elif priority == "MEDIUM":
            sla = "24-48 Hours"
            recommendation = f"Standard Maintenance Queue: Assign to {department} local ward supervisor with {sla} SLA."
        else:
            sla = "5-7 Days"
            recommendation = f"Routine Processing: Route to {department} administrative queue with {sla} SLA."

        return {
            "root_issue": root_asset,
            "recommended_department": department,
            "priority": priority,
            "explanation": reason,
            "status": "PENDING REVIEW",
            "sla": sla,
            "recommendation": recommendation,
            "complications": complications,
            "steps": {
                "step_1_complaint_understanding": {
                    "summary": f"Analyzed incident semantics: Identified '{root_asset}' under {department}.",
                    "intent": intent,
                    "confidence": round(confidence, 2)
                },
                "step_2_root_civic_asset": root_asset,
                "step_3_department_recommendation": department,
                "step_4_complications_and_impact": {
                    "complication_score": complications["score"],
                    "complications_detected": complications["detected"],
                    "severity_assessment": reason
                },
                "step_5_priority_assessment": priority
            },
            # Backwards compatibility fields
            "department": department,
            "intent": intent,
            "confidence": round(confidence, 2),
            "reason": reason,
            "engine": "CityBrain Intelligent AI Triage Engine (v3.2)"
        }


# Global singleton instance
priority_engine = IntelligentPriorityEngine()
nlp_analyzer = priority_engine

def analyze_prompt(text: str, category: Optional[str] = None) -> Dict[str, Any]:
    """Helper function to analyze an incident prompt."""
    return priority_engine.analyze(text, category)

def get_priority_and_department(text: str, category: Optional[str] = None) -> Tuple[str, str]:
    """Helper function returning (priority, department) tuple."""
    res = priority_engine.analyze(text, category)
    return res["priority"], res["department"]

def synthesize_civic_meaning(literal_en: str, raw_orig: str = "") -> str:
    """
    Translates raw colloquial, emotional, or translated citizen speech into
    a formal, high-clarity civic statement reflecting the exact MEANING, physical defect,
    and municipal hazard rather than literal word-by-word phrasing.
    """
    if not literal_en or not literal_en.strip():
        return ""

    t = literal_en.lower().strip()
    analysis = priority_engine.analyze(literal_en)
    asset = analysis.get("root_issue", "Civic Infrastructure Disrepair")
    compl = analysis.get("complications", {}).get("detected", [])

    # 1. Primary Physical Defect & Asset Context
    defect = ""
    if re.search(r"\b(pothole|potholes|crater|craters|road damage|broken road|sinkhole|cave[- ]?in)\b", t):
        if "sinkhole" in t or "cave" in t:
            defect = "Severe roadway structural collapse with deep sinkhole crater"
        else:
            defect = "Major road infrastructure degradation with deep pothole crater"
    elif re.search(r"\b(live wire|hanging wire|open cable|electric wire|power line|sparking wire|snapped wire|power cut|transformer)\b", t):
        if "transformer" in t:
            defect = "Municipal power grid transformer malfunction and electrical fault"
        elif any(k in t for k in ["wire", "cable", "line"]):
            defect = "Exposed high-voltage electrical power cable snapped and fallen"
        else:
            defect = "Severe electrical grid failure and localized power outage"
    elif re.search(r"\b(pipe|pipeline|leak|burst|water line|drinking water)\b", t):
        if "burst" in t or "heavy" in t or "river" in t:
            defect = "Pressurized municipal water distribution pipeline rupture and major inundation"
        elif any(k in t for k in ["drinking", "dirty", "contaminated", "muddy"]):
            defect = "Severe municipal drinking water contamination with turbid supply"
        else:
            defect = "Municipal water pipeline leak and continuous water wastage"
    elif re.search(r"\b(drain|drainage|sewer|gutter|overflow|sewerage|manhole)\b", t):
        if "manhole" in t:
            defect = "Dangerous uncovered deep municipal sewer manhole on public thoroughfare"
        else:
            defect = "Clogged municipal drainage network causing foul sewage overflow"
    elif re.search(r"\b(garbage|trash|waste|dump|stench|smell|dead animal|carcass)\b", t):
        if "animal" in t or "carcass" in t:
            defect = "Decomposing animal carcass on public pathway posing acute biohazard"
        else:
            defect = "Heavy uncollected solid waste accumulation emitting severe foul stench"
    elif re.search(r"\b(street light|street lights|light|dark|bulb)\b", t):
        defect = "Non-functional municipal street lighting causing dark, unsafe road corridor"
    elif re.search(r"\b(fire|blaze|flames|smoke|explosion|gas leak)\b", t):
        defect = "Active fire and hazardous emergency situation requiring urgent suppression"
    elif re.search(r"\b(accident|injured|bleeding|ambulance)\b", t):
        defect = "Acute emergency casualty incident requiring urgent paramedic medical response"
    elif re.search(r"\b(theft|robbery|assault|crime|knife|gun|threat)\b", t):
        defect = "Active public safety emergency involving criminal threat and civil disturbance"
    else:
        clean_summary = literal_en.rstrip(". ")
        defect = clean_summary[:1].upper() + clean_summary[1:] if clean_summary else asset

    # 2. Observed Impact, Hazards & Real-World Consequences
    impacts = []
    if re.search(r"\b(accident|accidents|fell|falling|slip|slipped|crash|crashed|injured|injuries|damage)\b", t):
        impacts.append("causing active vehicular accidents and commuter injury risk")
    if re.search(r"\b(spark|sparks|shock|electrocution|sparks flying|fire hazard)\b", t):
        impacts.append("emitting hazardous electrical sparks with lethal electrocution danger")
    if re.search(r"\b(flood|flooding|water entered|homes|houses|dwelling|dwellings|inside|shop|shops)\b", t):
        impacts.append("inundating nearby dwellings and disrupting local access")
    if re.search(r"\b(disease|diseases|smell|stench|unbearable|dogs|mosquito|dengue|malaria|hygiene|unhygienic)\b", t):
        impacts.append("generating vector-borne disease threats and critical unhygienic conditions")
    if re.search(r"\b(school|children|students|kids)\b", t):
        impacts.append("situated in immediate proximity to school zone endangering students")
    if re.search(r"\b(hospital|clinic|patient|patients|icu)\b", t):
        impacts.append("obstructing critical emergency access route to healthcare facility")
    if re.search(r"\b(traffic|block|blocked|gridlock|jam)\b", t):
        impacts.append("creating severe traffic gridlock across primary transit corridor")
    if re.search(r"\b(dark|theft|unsafe|danger|women|evening|night)\b", t):
        impacts.append("compromising night-time public transit safety")

    # 3. Incorporate Detected Complications
    for c in compl:
        if "School" in c and not any("school" in p for p in impacts):
            impacts.append("located in high-vulnerability school vicinity")
        if "Lethal" in c and not any("electrocution" in p for p in impacts):
            impacts.append("posing acute life-safety electrical hazard")
        if "Widespread" in c and not any("inundating" in p for p in impacts):
            impacts.append("impacting entire residential sector")

    if impacts:
        statement = defect + ", " + ", ".join(impacts) + "."
    elif defect and defect != asset and defect != "Municipal civic infrastructure disrepair" and len(literal_en.split()) > 3:
        statement = defect + ". Urgent municipal inspection and maintenance required."
    else:
        statement = literal_en.strip()

    return statement
