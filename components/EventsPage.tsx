
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Zap, 
  Search, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  ArrowRight, 
  Ticket, 
  CalendarDays,
  Calendar as CalendarIcon,
  AlertCircle,
  ArrowUp,
  CalendarCheck,
  X,
  Rocket,
  ChevronRight, 
  Map as MapIcon,
  Timer,
  ThumbsDown,
  UserCheck,
  Layout,
  Heart,
  Terminal,
  Palette,
  Mic2,
  Trophy,
  ExternalLink,
  Code2,
  Cpu,
  ShieldAlert,
  Sparkles,
  MousePointer2,
  CheckCircle2,
  Image as ImageIcon,
  GraduationCap,
  ShieldCheck,
  Users2,
  Info,
  Target,
  Gift,
  Award,
  Briefcase,
  HelpCircle,
  Shield,
  Laptop,
  ChevronLeft,
  UserPlus,
  Send,
  Check,
  Flame,
  Phone,
  Mail,
  LifeBuoy,
  History,
  Camera,
  MessageCircle
} from 'lucide-react';
import { useTutorial } from './tutorial/TutorialContext';

import { 
  CampusEvent, Team, TeamMember, ChatMessage, JoinRequest, ChatAttachment,
  TimelineItem, Prize, Sponsor, Judge, FAQ
} from './events/types';

export type { 
  CampusEvent, Team, TeamMember, ChatMessage, JoinRequest, ChatAttachment,
  TimelineItem, Prize, Sponsor, Judge, FAQ
};
import EventsHeader from './events/EventsHeader';
import TeamPortal from './events/TeamPortal/TeamPortal';
import EventsDiscovery from './events/Discovery/EventsDiscovery';
import EventDetailsModal from './events/Modals/EventDetailsModal';
import SharedModals from './events/Modals/SharedModals';
import BackToTop from './events/BackToTop';
import ImageWithFallback from './events/ImageWithFallback';
import { parseDateTime } from './events/utils';
import { useEventsData } from './events/useEventsData';
import { MiniFloatingCalendar } from './MiniFloatingCalendar';
import { EventsFeedSkeleton, EventsErrorScreen, EventsEmptyScreen } from './events/EventsLoadingScreen';
import { eventsService } from '../services/eventsService';
import { teamsService } from '../services/teamsService';
import { chatService } from '../services/chatService';
import { AuthUser } from '../services/authService';
import { getSocket } from '../services/socketClient';

// -- Mock Helpers & Constants --
const TODAY_DAY = new Date().getDate();
const now = new Date();

const getUrgentDate = () => {
  const d = new Date();
  d.setHours(d.getHours() + 2);
  return {
    day: d.getDate(),
    dateStr: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    timeStr: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  };
};

const urgentInfo = getUrgentDate();
export const EVENTS_MOCK: CampusEvent[] = [
  {
    id: 'e_urgent_flash',
    title: 'Flash Code Sprint',
    category: 'Competition',
    type: 'Upcoming',
    date: urgentInfo.dateStr,
    dayOfMonth: urgentInfo.day,
    time: urgentInfo.timeStr,
    location: 'Server Room 404',
    domain: 'Competitive Programming',
    xp: 5000,
    attendees: 50,
    sectionParticipants: 5,
    featured: true,
    prizePool: "₹50,000 Instant",
    tracks: ["Speed Coding", "Bug Fixing"],
    posterUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000",
    description: "A surprise lightning round of competitive programming. The clock is ticking, and the deadline is approaching fast.",
    jokes: ["Code faster, the server bills are due.", "Urgent? I thought you said URGENT."],
    timeline: [ { time: urgentInfo.timeStr, title: "Sprint Start", desc: "Go go go!" } ],
    venueDetails: "Server Room 404",
    eligibility: "Speedsters",
    teamSize: "Individual",
    certification: true,
    organizerContact: { phone: "+1 (555) 987-6543", email: "flash@artemis.events" },
    isPaid: false,
    registrationFee: "Free",
    duration: "2 Hours",
    format: {
      rounds: ["Problem Reveal", "Coding Sprint", "Evaluation"],
      type: 'Online',
      mode: 'Solo'
    },
    dos: ["Prepare your environment", "Check your internet", "Focus on efficiency"],
    donts: ["No external help", "No code sharing during the sprint"],
    rules: [
      "Individual participation only.",
      "Solutions must be submitted within the time limit.",
      "Plagiarism check will be performed on all submissions."
    ]
  },
  {
    id: 'e_closing_soon_2',
    title: 'UI Design Jam',
    category: 'Workshop',
    type: 'Upcoming',
    date: '12 May 2026',
    dayOfMonth: 12,
    time: '10:00 AM',
    location: 'Design Lab',
    domain: 'UI/UX Design',
    xp: 1500,
    attendees: 45,
    sectionParticipants: 8,
    prizePool: "₹5,000",
    tracks: ["Prototyping", "Design Ops"],
    posterUrl: "https://images.unsplash.com/photo-1541462608141-ad60397d5873?auto=format&fit=crop&q=80&w=1000",
    description: "A rapid prototyping challenge. Show us your best workflow.",
    jokes: ["Iterate or die."],
    timeline: [{ time: "10:00 AM", title: "Kickoff", desc: "Start jamming!" }],
    venueDetails: "Room 101, Arts Block.",
    eligibility: "Designers",
    teamSize: "Individual",
    certification: true,
    organizerContact: { phone: "+91 12345 67890", email: "jam@artemis.events" },
    isPaid: false,
    registrationFee: "Free",
    duration: "4 Hours",
    format: { rounds: ["Kickoff", "Design Phase", "Review"], type: 'Offline', mode: 'Solo' },
    dos: ["Bring your laptop"],
    donts: ["Don't skip research"],
    rules: ["Figma only."]
  },
  {
    id: 'e_closing_soon_3',
    title: 'Cloud Security Challenge',
    category: 'Competition',
    type: 'Upcoming',
    date: '13 May 2026',
    dayOfMonth: 13,
    time: '02:00 PM',
    location: 'Cyber Hub',
    domain: 'Cybersecurity',
    xp: 2500,
    attendees: 120,
    sectionParticipants: 15,
    prizePool: "₹25,000",
    tracks: ["AWS Security", "Pen-testing"],
    posterUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000",
    description: "Find the vulnerabilities in our cloud infrastructure before the time runs out.",
    jokes: ["403 Forbidden is my favorite status code."],
    timeline: [{ time: "02:00 PM", title: "Target Reveal", desc: "Go!" }],
    venueDetails: "Block D, 2nd Floor.",
    eligibility: "Security Enthusiasts",
    teamSize: "Individual or Pairs",
    certification: true,
    organizerContact: { phone: "+91 09876 54321", email: "security@artemis.events" },
    isPaid: false,
    registrationFee: "Free",
    duration: "6 Hours",
    format: { rounds: ["Recon", "Exploit", "Report"], type: 'Online', mode: 'Both' },
    dos: ["Be ethical"],
    donts: ["No destructive attacks"],
    rules: ["Standard CTF rules."]
  },
  {
    id: 'e_closing_soon_1',
    title: 'AI Ethics Debate',
    category: 'Seminar',
    type: 'Upcoming',
    date: '8 May 2026',
    dayOfMonth: 8,
    time: '02:00 PM',
    location: 'Main Hall',
    domain: 'AI & Ethics',
    xp: 1200,
    attendees: 150,
    sectionParticipants: 10,
    prizePool: "₹10,000",
    tracks: ["Ethics", "AI Policy"],
    posterUrl: "https://images.unsplash.com/photo-1591115765373-520b7a6f7104?auto=format&fit=crop&q=80&w=1000",
    description: "Discussing the philosophical and legal implications of autonomous agents.",
    jokes: ["My AI told me it has no comment on this debate."],
    timeline: [{ time: "02:00 PM", title: "Opening", desc: "Intro to AI Ethics." }],
    venueDetails: "Main Hall, Level 2.",
    eligibility: "All Students",
    teamSize: "1-2 Members",
    certification: true,
    organizerContact: { phone: "+91 98765 43210", email: "ethics@campus.edu" },
    isPaid: false,
    registrationFee: "Free",
    duration: "3 Hours",
    format: { rounds: ["Opening", "Debate", "Conclusion"], type: 'Offline', mode: 'Both' },
    dos: ["Research beforehand", "Be respectful"],
    donts: ["No AI-generated arguments"],
    rules: ["Standard debate rules apply."]
  },
  {
    id: 'e_upcoming_1',
    title: 'Web3 Hackathon 2026',
    category: 'Competition',
    type: 'Upcoming',
    date: '20 Nov 2026',
    dayOfMonth: 20,
    time: '10:00 AM',
    location: 'Crypto Lab',
    domain: 'Blockchain/Web3',
    xp: 3000,
    attendees: 300,
    sectionParticipants: 25,
    prizePool: "₹2,00,000",
    tracks: ["DeFi", "NFTs", "DAOs"],
    posterUrl: "https://images.unsplash.com/photo-1639762681485-074b7f4ecb3c?auto=format&fit=crop&q=80&w=1000",
    description: "Build the future of decentralized finance.",
    jokes: ["WAGMI, but only if you ship."],
    timeline: [{ time: "10:00 AM", title: "Kickoff", desc: "Rules and API keys." }],
    venueDetails: "Block C, 3rd Floor.",
    eligibility: "Developers",
    teamSize: "1-4 Members",
    certification: true,
    organizerContact: { phone: "+91 88888 77777", email: "web3@campus.edu" },
    isPaid: true,
    registrationFee: "₹499",
    duration: "48 Hours",
    format: { rounds: ["Intro", "Hacking", "Demo"], type: 'Hybrid', mode: 'Team' },
    dos: ["Write clean code", "Use provided APIs"],
    donts: ["No pre-built projects"],
    rules: ["24-hour hacking window."]
  },
  {
    id: 'e_past_1',
    title: 'Design Sprint: Spring 2026',
    category: 'Workshop',
    type: 'Past',
    date: '2 May 2026',
    dayOfMonth: 2,
    time: '11:00 AM',
    location: 'Design Studio',
    domain: 'Product Design',
    xp: 800,
    attendees: 80,
    sectionParticipants: 12,
    prizePool: "Wacom Tablet",
    tracks: ["UX", "UI"],
    posterUrl: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&q=80&w=1000",
    description: "A fast-paced product design challenge.",
    jokes: ["Making the logo bigger since 2020."],
    timeline: [{ time: "11:00 AM", title: "Review", desc: "Final designs showcase." }],
    venueDetails: "Art Block, Room 101.",
    eligibility: "Designers",
    teamSize: "1-3 Members",
    certification: true,
    organizerContact: { phone: "+91 77777 66666", email: "design@campus.edu" },
    isPaid: false,
    registrationFee: "Free",
    duration: "6 Hours",
    format: { rounds: ["Research", "Design", "Feedback"], type: 'Offline', mode: 'Solo' },
    dos: ["Focus on accessibility"],
    donts: ["Don't skip the wireframe"],
    rules: ["Use Figma or Adobe XD."]
  },
  {
    id: 'e_mumbai',
    title: 'Mumbai Developer Summit 2026',
    category: 'Competition',
    type: 'Upcoming',
    date: '15 Nov 2026',
    dayOfMonth: 15,
    time: '09:00 AM',
    location: 'IIT Bombay Campus',
    domain: 'HFT & Blockchain',
    xp: 2500,
    attendees: 1200,
    sectionParticipants: 42,
    prizePool: "₹5,00,000",
    tracks: ["Web3 Foundations", "HFT Optimization", "Quantum Ready Apps"],
    posterUrl: "https://images.unsplash.com/photo-1540575467063-178cb50ee898?auto=format&fit=crop&q=80&w=1000",
    description: "The biggest tech convergence in the financial capital. From high-frequency trading algorithms to decentralized architectures. Experience the spirit of Mumbai's tech ecosystem without the traffic.",
    jokes: [
      "Mumbai jaana hai ya nahi- Take part in mumbai hacks"
    ],
    timeline: [
      { time: "09:00 AM", title: "Opening Keynote", desc: "Welcome address by industry leaders in AI and Finance." },
      { time: "11:30 AM", title: "Track A: Scalable Systems", desc: "Deep dive into distributed architectures." }
    ],
    venueDetails: "IIT Bombay Campus, Convocation Hall. Landmark: Main Building Gate No. 1.",
    eligibility: "Undergraduates & Professionals",
    teamSize: "1-4 Members",
    certification: true,
    organizerContact: { phone: "+91 22 2572 2545", email: "summit2026@iitb.ac.in" },
    gallery: [
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1614064641913-6b17fda71221?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1000"
    ],
    isPaid: true,
    registrationFee: "₹499",
    duration: "10 Hours",
    format: {
      rounds: ["Intro & Networking", "Technical Workshop", "Panel Discussion"],
      type: 'Offline',
      mode: 'Solo'
    },
    dos: ["Bring your ID card", "Network actively", "Ask questions during Q&A"],
    donts: ["No recording during panel sessions", "No outside food inside the auditorium"],
    rules: [
      "ID card mandatory for entry.",
      "Registration non-refundable.",
      "Follow campus code of conduct."
    ]
  },
  {
    id: 'e1',
    title: 'Global AI Hackathon 2026',
    category: 'Competition',
    type: 'Live',
    date: '24 Nov 2026',
    dayOfMonth: 24,
    time: '48H Non-stop',
    location: 'Innovation Wing',
    domain: 'Artificial Intelligence',
    xp: 1200,
    attendees: 420,
    sectionParticipants: 15,
    featured: true,
    prizePool: "$50,000",
    tracks: ["LLM Agents", "Computer Vision", "AI Safety", "Generative Art"],
    posterUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=1000",
    description: "The ultimate showdown of neural networks. Build the future of AGI in 48 hours. Dive into high-concurrency challenges and state-of-the-art inference optimization. No sleep, just code. This event brings together the brightest minds to solve real-world problems using the latest in AI technology.",
    jokes: ["AI Hackathon? Bhai, ChatGPT se copy-paste karna 'hacking' nahi hota."],
    timeline: [
      { time: "Day 1 - 08:00 AM", title: "Registration & Check-in", desc: "Get your badges, swag kits, and Wi-Fi credentials. Networking breakfast." },
      { time: "Day 1 - 10:00 AM", title: "Opening Ceremony", desc: "Keynote by Industry Leaders and Problem Statement Reveal." },
      { time: "Day 1 - 11:00 AM", title: "Hacking Starts", desc: "Official start of the 48-hour coding marathon." },
      { time: "Day 1 - 08:00 PM", title: "Mentorship Round 1", desc: "Industry experts visit tables for guidance." },
      { time: "Day 2 - 09:00 PM", title: "Code Freeze & Submission", desc: "Stop coding. Push to GitHub. Prepare for demos." }
    ],
    venueDetails: "Innovation Wing, 4th Floor Tech Park. Access via Lift B.",
    eligibility: "Open for All Students",
    teamSize: "Individual or Pairs",
    certification: true,
    prizesList: [
      { title: "Grand Winner", desc: "Best Overall AI Solution", amount: "$25,000", color: "from-amber-400 to-orange-500" },
      { title: "Runner Up", desc: "Second Place Excellence", amount: "$15,000", color: "from-slate-300 to-slate-400" },
      { title: "Innovation Award", desc: "Most creative use of LLMs", amount: "$5,000", color: "from-blue-400 to-sky-500" },
      { title: "Student Track", desc: "Best project by undergraduates", amount: "MacBook Pros", color: "from-emerald-400 to-teal-500" }
    ],
    sponsors: [
      { name: "OpenAI", tier: "Platinum" },
      { name: "NVIDIA", tier: "Platinum" },
      { name: "Google Cloud", tier: "Gold" },
      { name: "AWS", tier: "Gold" },
      { name: "Anthropic", tier: "Silver" }
    ],
    judges: [
      { name: "Dr. Sarah Chen", role: "Head of AI", company: "DeepMind", avatarUrl: "https://i.pravatar.cc/150?img=5" },
      { name: "Alex Rivera", role: "Principal Engineer", company: "Anthropic", avatarUrl: "https://i.pravatar.cc/150?img=11" },
      { name: "Marcus Johnson", role: "VC Partner", company: "Sequoia", avatarUrl: "https://i.pravatar.cc/150?img=3" },
      { name: "Priya Patel", role: "CTO", company: "TechFlow", avatarUrl: "https://i.pravatar.cc/150?img=9" }
    ],
    rules: [
      "All code must be written during the event. Pre-existing codebases are not allowed.",
      "Teams can have a maximum of 4 members.",
      "Use of open-source libraries is encouraged, but plagiarism will lead to disqualification.",
      "Final submission must include a GitHub repo link and a 2-minute demo video.",
      "Be respectful to other participants and staff. Harassment of any kind will not be tolerated."
    ],
    faqs: [
      { q: "Do I need an idea beforehand?", a: "No! We will have an ideation session at the start of the event to help you form teams and brainstorm." },
      { q: "Is food provided?", a: "Yes, we provide breakfast, lunch, dinner, and midnight snacks for all 48 hours." },
      { q: "Can I participate remotely?", a: "This is a hybrid event. You can participate online, but in-person teams get access to hardware labs." },
      { q: "What hardware is provided?", a: "We have a limited number of GPUs available on the cloud. Bring your own laptop." }
    ],
    organizerContact: { phone: "+1 (555) 123-4567", email: "ai.hackathon@global.org" },
    gallery: [
      "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1000"
    ],
    isPaid: false,
    registrationFee: "Free",
    duration: "48 Hours",
    format: {
      rounds: ["Ideation & Pitching", "48H Hacking", "Final Demo & Judging"],
      type: 'Hybrid',
      mode: 'Team'
    },
    dos: ["Write original code", "Collaborate with mentors", "Focus on impact"],
    donts: ["No plagiarism", "No harassment", "Don't ignore the problem statement"],
  },
  {
    id: 'e_cyber',
    title: 'Cyber Security Gauntlet',
    category: 'Competition',
    type: 'Past',
    date: '30 Apr 2026',
    dayOfMonth: 30,
    time: '12:00 PM',
    location: 'Secure Lab 7',
    domain: 'Cybersecurity',
    xp: 800,
    attendees: 85,
    sectionParticipants: 4,
    prizePool: "Ethical Hacker Vouchers",
    tracks: ["Network Infiltration", "Cloud Security"],
    posterUrl: "https://images.unsplash.com/photo-1614064641913-6b17fda71221?auto=format&fit=crop&q=80&w=1000",
    description: "Defend your infrastructure against simulated zero-day attacks. The ultimate capture the flag event. One breach and you're out.",
    jokes: ["Your password is 'password123', isn't it? Please don't enter."],
    timeline: [{ time: "12:00 PM", title: "Breach Phase", desc: "Initial infiltration attempts start." }],
    venueDetails: "Basement Lab 7, Engineering Block.",
    eligibility: "Advanced Cybersecurity Students",
    teamSize: "Individual Only",
    certification: false,
    organizerContact: { phone: "+1 (555) 555-7890", email: "security@artemis.events" },
    isPaid: false,
    registrationFee: "Free",
    duration: "4 Hours",
    format: {
      rounds: ["Reconnaissance", "Exploitation", "Capture the Flag"],
      type: 'Offline',
      mode: 'Solo'
    },
    dos: ["Bring your own laptop", "Charge your devices", "Follow ethical guidelines"],
    donts: ["No attacking the infrastructure", "No collusion with other participants"],
    rules: [
      "CTF format with hidden flags in vulnerable services.",
      "Points awarded based on difficulty of flags.",
      "Final ranking determined by total points and submission time."
    ]
  },
  {
    id: 'e2',
    title: 'UI Mastery Workshop',
    category: 'Workshop',
    type: 'Upcoming',
    date: '26 Nov 2026',
    dayOfMonth: 26,
    time: '10:00 AM',
    location: 'Design Lab B',
    domain: 'UI Design',
    xp: 400,
    attendees: 120,
    sectionParticipants: 8,
    tracks: ["Figma 101", "Design Systems"],
    posterUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1000",
    description: "Sacred art of whitespace and color theory. Learn why 'making the logo bigger' is a sin and how to build components that don't break.",
    jokes: ["UI Master banega? Tera choice of colors dekh ke meri aankhein ro rahi hain."],
    timeline: [{ time: "10:00 AM", title: "Intro to Figma", desc: "Basics of layout." }],
    venueDetails: "Design Lab B, Arts Block.",
    eligibility: "Beginners to Design",
    teamSize: "No Limit",
    certification: true,
    organizerContact: { phone: "+1 (555) 111-2222", email: "design@artemis.events" },
    isPaid: true,
    registrationFee: "₹199",
    duration: "3 Hours",
    format: {
      rounds: ["Intro to Design Systems", "Hands-on Figma Session", "Project Showcase"],
      type: 'Offline',
      mode: 'Solo'
    },
    dos: ["Install Figma beforehand", "Bring a mouse for better control", "Ask questions during the demo"],
    donts: ["No distracting others", "No sharing workshop assets externally"],
    rules: [
      "Workshop-only participation.",
      "Certificate provided upon completion of the hands-on project.",
      "Assets provided are for educational use only."
    ]
  },
  {
    id: 'e_fintech',
    title: 'Algo-Trading Sprint',
    category: 'Competition',
    type: 'Upcoming',
    date: '29 Nov 2026',
    dayOfMonth: 29,
    time: '08:00 AM',
    location: 'Finance Hub',
    domain: 'FinTech',
    xp: 2000,
    attendees: 150,
    sectionParticipants: 12,
    prizePool: "$15,000",
    tracks: ["HFT", "Crypto Arbitrage", "Sentiment Analysis"],
    posterUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1000",
    description: "Build the fastest trading bot. We provide the historical data; you provide the alpha. Warning: High variance event.",
    jokes: ["Buy high, sell low, right?", "My strategy is purely hope-based."],
    timeline: [
      { time: "08:00 AM", title: "Market Open", desc: "API keys distributed." },
      { time: "04:00 PM", title: "Market Close", desc: "Final P&L calculation." }
    ],
    venueDetails: "Finance Hub, Building C.",
    eligibility: "Quant Enthusiasts",
    teamSize: "1-3 Members",
    certification: true,
    organizerContact: { phone: "+1 (555) 333-4444", email: "fintech@artemis.events" },
    isPaid: true,
    registrationFee: "₹299",
    duration: "8 Hours",
    format: {
      rounds: ["Strategy Building", "Algorithm Deployment", "Market Simulation"],
      type: 'Online',
      mode: 'Team'
    },
    dos: ["Test your algorithms", "Monitor your bot performance", "Use robust error handling"],
    donts: ["No manual trades during simulation", "No exploiting API vulnerabilities"],
    rules: [
      "Trading bots must operate autonomously.",
      "Performance measured by risk-adjusted returns.",
      "Algorithms must adhere to the provided rate limits."
    ]
  },
  {
    id: 'e_robowars',
    title: 'RoboWars 2026',
    category: 'Competition',
    type: 'Upcoming',
    date: '12 Jun 2026',
    dayOfMonth: 12,
    time: '10:00 AM',
    location: 'The Arena',
    domain: 'Robotics',
    xp: 3000,
    attendees: 800,
    sectionParticipants: 45,
    prizePool: "₹2,00,000",
    tracks: ["Deathmatch", "Obstacle Course"],
    posterUrl: "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&q=80&w=1000",
    description: "Sparks, metal, and destruction. Bring your battle bots to the arena and fight for glory. Safety goggles mandatory.",
    jokes: ["It's not a bug, it's a surprise weapon.", "My robot is peaceful, said no one ever."],
    timeline: [
      { time: "10:00 AM", title: "Weigh In", desc: "Bot inspection." },
      { time: "12:00 PM", title: "Round 1", desc: "Fight!" }
    ],
    venueDetails: "Central Arena.",
    eligibility: "Engineering Teams",
    teamSize: "4-6 Members",
    certification: true,
    organizerContact: { phone: "+1 (555) 444-5555", email: "robotics@artemis.events" },
    gallery: [
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1524143986875-3b098d78b363?auto=format&fit=crop&q=80&w=1000"
    ],
    isPaid: true,
    registrationFee: "₹1,499 per team",
    duration: "2 Days",
    format: {
      rounds: ["Pit Strategy", "Heat Rounds", "Grand Finals"],
      type: 'Offline',
      mode: 'Team'
    },
    dos: ["Wear safety gear at all times", "Follow referee instructions", "Bring spare parts"],
    donts: ["No unsportsmanlike behavior", "No modifications after weigh-in"],
    rules: [
      "Bots must meet weight and size specifications.",
      "No flammable or explosive weapons allowed.",
      "Matches last 3 minutes or until knockout."
    ]
  },
  {
    id: 'e_product_hunt',
    title: 'Product Hunt Live 2026',
    category: 'Seminar',
    type: 'Upcoming',
    date: '30 May 2026',
    dayOfMonth: 30,
    time: '04:00 PM',
    location: 'Auditorium A',
    domain: 'Product Management',
    xp: 1500,
    attendees: 500,
    sectionParticipants: 18,
    tracks: ["Product Launch", "Growth Hacking"],
    posterUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=1000",
    description: "Witness the launch of the next big things. Get insights from top product managers and founders.",
    jokes: ["Ship it or rip it.", "Is this a feature or a bug? Yes."],
    timeline: [{ time: "04:00 PM", title: "Keynote", desc: "Future of Product Management." }],
    venueDetails: "Auditorium A, Ground Floor.",
    eligibility: "All Students",
    teamSize: "Individual",
    certification: true,
    organizerContact: { phone: "+1 (555) 777-8888", email: "ph@artemis.events" },
    isPaid: false,
    registrationFee: "Free",
    duration: "4 Hours",
    format: { rounds: ["Product Demos", "Q&A Session", "Networking"], type: 'Offline', mode: 'Solo' },
    dos: ["Prepare questions", "Network with founders"],
    donts: ["No self-promotion without approval"],
    rules: ["Professional conduct required."]
  },
  {
    id: 'e_quantum',
    title: 'Quantum Computing Workshop',
    category: 'Workshop',
    type: 'Upcoming',
    date: '5 Jun 2026',
    dayOfMonth: 5,
    time: '11:00 AM',
    location: 'Physics Annex',
    domain: 'Quantum Computing',
    xp: 1000,
    attendees: 45,
    sectionParticipants: 3,
    tracks: ["Qubits", "Quantum Algorithms"],
    posterUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1000",
    description: "Understand the basics of quantum computing and run your first circuit on a simulator.",
    jokes: ["I'm in both states of understanding this.", "Entanglement is my relationship status."],
    timeline: [{ time: "11:00 AM", title: "Theory", desc: "Introduction to Qubits." }],
    venueDetails: "Physics Annex, Room 302.",
    eligibility: "CS/Physics Students",
    teamSize: "Individual",
    certification: true,
    organizerContact: { phone: "+1 (555) 000-1111", email: "quantum@artemis.events" },
    isPaid: true,
    registrationFee: "₹299",
    duration: "5 Hours",
    format: { rounds: ["Theoretical Foundation", "Hands-on Simulator", "Advanced Concepts"], type: 'Offline', mode: 'Solo' },
    dos: ["Review linear algebra basics"],
    donts: ["Don't be intimidated by the math"],
    rules: ["Prerequisite: Basic programming knowledge."]
  },
  {
    id: 'e_metaverse',
    title: 'Metaverse Buildathon',
    category: 'Competition',
    type: 'Upcoming',
    date: '20 Jun 2026',
    dayOfMonth: 20,
    time: '10:00 AM',
    location: 'VR Studio',
    domain: 'AR/VR & Metaverse',
    xp: 2800,
    attendees: 200,
    sectionParticipants: 15,
    prizePool: "Meta Quest 4 Pros",
    tracks: ["VR Experience", "Social Spaces", "Avatars"],
    posterUrl: "https://images.unsplash.com/photo-1626379953822-baec19c3bbcd?auto=format&fit=crop&q=80&w=1000",
    description: "Create immersive worlds for the next generation of social interaction.",
    jokes: ["In the metaverse, nobody knows you're a dog.", "Buffering in VR is a spiritual experience."],
    timeline: [{ time: "10:00 AM", title: "World Building", desc: "Start of the buildathon." }],
    venueDetails: "Block F, VR Lab.",
    eligibility: "Unity/Unreal Developers",
    teamSize: "1-4 Members",
    certification: true,
    organizerContact: { phone: "+1 (555) 666-7777", email: "metaverse@artemis.events" },
    isPaid: false,
    registrationFee: "Free",
    duration: "3 Days",
    format: { rounds: ["Environment Design", "Interaction Logic", "Final Walkthrough"], type: 'Hybrid', mode: 'Team' },
    dos: ["Focus on optimization", "Test on multiple devices"],
    donts: ["Don't ignore motion sickness guidelines"],
    rules: ["Original assets preferred."]
  }
];

// Helper to produce mock message ISO dates offset from now
const getMockDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const MOCK_TEAMS: Team[] = [
  {
    id: 't1',
    name: 'Neural Knights',
    hackathon: 'Global AI Hackathon',
    description: 'Building LLM-powered agents for automated code review.',
    expectations: [
      'Active contribution required',
      'Must know React & Python',
      'Daily communication expected',
      'Passionate about AI Safety'
    ],
    maxMembers: 4,
    status: 'Open',
    members: [
      { id: 'me', name: 'Ajay Yadav', role: 'Team Lead', skills: ['Full-Stack', 'Python'], avatar: 'https://i.pravatar.cc/150?img=12' },
      { id: 'm2', name: 'Sarah Chen', role: 'AI Engineer', skills: ['PyTorch', 'NLP'], avatar: 'https://i.pravatar.cc/150?img=45' },
      { id: 'p4', name: 'Timothee Chalamet', role: 'Research', skills: ['Transformers'], avatar: 'https://i.pravatar.cc/150?img=18' },
      { id: 'p1', name: 'Zoe Kravitz', role: 'Backend', skills: ['FastAPI'], avatar: 'https://i.pravatar.cc/150?img=32' }
    ],
    messages: [
      { id: '1', senderId: 'm2', senderName: 'Sarah', text: 'Hey team! Just finished the baseline model.', timestamp: '10:30 AM', date: getMockDate(3), isMe: false },
      { id: '2', senderId: 'me', senderName: 'Ajay', text: 'Awesome! I am working on the frontend integration.', timestamp: '10:35 AM', date: getMockDate(3), isMe: true },
      { id: '3', senderId: 'p4', senderName: 'Timothee', text: 'I found a better dataset for the fine-tuning.', timestamp: '10:40 AM', date: getMockDate(1), isMe: false },
      { id: '4', senderId: 'p1', senderName: 'Zoe', text: 'Great! Should I start setting up the API endpoints?', timestamp: '10:42 AM', date: getMockDate(1), isMe: false },
      { id: '5', senderId: 'me', senderName: 'Ajay', text: 'Yes, Zoe. Let\'s use FastAPI for that.', timestamp: '10:45 AM', date: getMockDate(0), isMe: true },
      { id: '6', senderId: 'p1', senderName: 'Zoe', text: '🎙️ Voice message (0:04)', timestamp: '10:48 AM', date: getMockDate(0), isMe: false, audioDuration: 4 }
    ]
  },
  {
    id: 't2',
    name: 'Bit Wizards',
    hackathon: 'Algo-Trading Sprint',
    description: 'Developing low-latency arbitrage strategies.',
    expectations: [
      'Strong C++ or Rust skills',
      'Background in Finance/Math',
      'Available for 48H Sprint',
      'High attention to detail'
    ],
    maxMembers: 5,
    status: 'Open',
    members: [
      { id: 'me', name: 'Ajay Yadav', role: 'Quant Lead', skills: ['C++', 'Python'], avatar: 'https://i.pravatar.cc/150?img=12' },
      { id: 'm3', name: 'John Doe', role: 'Data Scientist', skills: ['NumPy', 'Pandas'], avatar: 'https://i.pravatar.cc/150?img=11' },
      { id: 'u1', name: 'Mike Ross', role: 'HFT Dev', skills: ['Rust'], avatar: 'https://i.pravatar.cc/150?img=33' },
      { id: 'u2', name: 'Elena Gilbert', role: 'Analyst', skills: ['Finance'], avatar: 'https://i.pravatar.cc/150?img=22' },
      { id: 'p2', name: 'Robert Pattinson', role: 'DevOps', skills: ['Docker'], avatar: 'https://i.pravatar.cc/150?img=11' }
    ],
    messages: [
      { id: '1', senderId: 'u1', senderName: 'Mike', text: 'The latency on the current bridge is too high.', timestamp: '11:00 AM', date: getMockDate(1), isMe: false },
      { id: '2', senderId: 'm3', senderName: 'John', text: 'I am optimizing the data ingestion pipeline.', timestamp: '11:05 AM', date: getMockDate(1), isMe: false },
      { id: '3', senderId: 'me', senderName: 'Ajay', text: 'Mike, check the Rust implementation. It should be sub-ms.', timestamp: '11:10 AM', date: getMockDate(0), isMe: true },
      { id: '4', senderId: 'u2', senderName: 'Elena', text: 'Are we following the arbitrage limit rules?', timestamp: '11:15 AM', date: getMockDate(0), isMe: false },
      { id: '5', senderId: 'p2', senderName: 'Robert', text: 'Infrastructure is ready for load testing.', timestamp: '11:20 AM', date: getMockDate(0), isMe: false }
    ]
  },
  {
    id: 't3',
    name: 'Pixel Perfect',
    hackathon: 'UI Mastery Workshop',
    description: 'Polishing our design system for the final showcase.',
    maxMembers: 3,
    status: 'Open',
    members: [
      { id: 'me', name: 'Ajay Yadav', role: 'UI Lead', skills: ['Figma', 'React'], avatar: 'https://i.pravatar.cc/150?img=12' },
      { id: 'p3', name: 'Lily Rose', role: 'Designer', skills: ['UI/UX'], avatar: 'https://i.pravatar.cc/150?img=25' },
      { id: 'p4', name: 'Timothee Chalamet', role: 'Frontend', skills: ['Tailwind'], avatar: 'https://i.pravatar.cc/150?img=18' }
    ],
    messages: [
      { id: '1', senderId: 'p3', senderName: 'Lily', text: 'Finished the design for the landing page!', timestamp: '09:00 AM', date: getMockDate(1), isMe: false },
      { id: '2', senderId: 'me', senderName: 'Ajay', text: 'Looks clean! Can you export the assets?', timestamp: '09:10 AM', date: getMockDate(0), isMe: true },
      { id: '3', senderId: 'p4', senderName: 'Timothee', text: 'I am starting on the hero section components.', timestamp: '09:15 AM', date: getMockDate(0), isMe: false }
    ]
  },
  {
    id: 't4',
    name: 'Cyber Sentinels',
    hackathon: 'Cyber Security Gauntlet',
    description: 'Defending the core against penetration tests.',
    maxMembers: 4,
    status: 'Closed',
    members: [
      { id: 'me', name: 'Ajay Yadav', role: 'Security Analyst', skills: ['Burp Suite', 'Wireshark'], avatar: 'https://i.pravatar.cc/150?img=12' },
      { id: 'm4', name: 'Alice Smith', role: 'Pen-tester', skills: ['Metasploit'], avatar: 'https://i.pravatar.cc/150?img=23' },
      { id: 'm2', name: 'Sarah Chen', role: 'SecDev', skills: ['Go'], avatar: 'https://i.pravatar.cc/150?img=45' },
      { id: 'u1', name: 'Mike Ross', role: 'Network Eng', skills: ['Cisco'], avatar: 'https://i.pravatar.cc/150?img=33' }
    ],
    messages: [
      { id: '1', senderId: 'm4', senderName: 'Alice', text: 'Found a SQL injection vulnerability in the demo app.', timestamp: '02:00 PM', date: getMockDate(1), isMe: false },
      { id: '2', senderId: 'me', senderName: 'Ajay', text: 'Patching it now. Sarah, check the middleware.', timestamp: '02:10 PM', date: getMockDate(0), isMe: true },
      { id: '3', senderId: 'm2', senderName: 'Sarah', text: 'Middleware is secure. The input was not sanitized.', timestamp: '02:15 PM', date: getMockDate(0), isMe: false },
      { id: '4', senderId: 'u1', senderName: 'Mike', text: 'Traffic spikes detected. Possible DDoS test?', timestamp: '02:20 PM', date: getMockDate(0), isMe: false }
    ]
  }
];

export const MOCK_TEAMS_POOL: Team[] = [
  {
    id: 'tp1',
    name: 'Byte Busters',
    hackathon: 'Flash Code Sprint',
    description: 'Fast and efficient bug hunters.',
    location: 'Server Room 404 • On-Campus',
    expectations: [
      'Quick problem solver',
      'Familiar with C++ debuggers',
      'Team player',
      'Reliable communication'
    ],
    maxMembers: 3,
    status: 'Open',
    members: [
      { id: 'u1', name: 'Mike Ross', role: 'Lead', skills: ['C++', 'Rust'], avatar: 'https://i.pravatar.cc/150?img=33' }
    ],
    messages: []
  },
  {
    id: 'tp2',
    name: 'Design Dynamos',
    hackathon: 'Global AI Hackathon',
    description: 'Creating the most intuitive UI for AI.',
    location: 'Design Studio B • Innovation Wing',
    expectations: [
      'Expert Figma skills',
      'Experience with React/Tailwind',
      'Eye for detail',
      'Collaborative mindset'
    ],
    maxMembers: 5,
    status: 'Open',
    members: [
      { id: 'u2', name: 'Elena Gilbert', role: 'UI/UX', skills: ['Figma', 'React'], avatar: 'https://i.pravatar.cc/150?img=22' }
    ],
    messages: []
  }
];export const PEERS_MOCK = [
  { id: 'p1', name: 'Zoe Kravitz', role: 'Full-Stack', avatar: 'https://i.pravatar.cc/150?img=32' },
  { id: 'p2', name: 'Robert Pattinson', role: 'DevOps', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 'p3', name: 'Lily Rose', role: 'UI/UX', avatar: 'https://i.pravatar.cc/150?img=25' },
  { id: 'p4', name: 'Timothee Chalamet', role: 'AI Engineer', avatar: 'https://i.pravatar.cc/150?img=18' }
];

export const SAMPLE_JOIN_REQUESTS: Record<string, JoinRequest[]> = {
  t1: [
    {
      id: 'req-sample-1',
      teamId: 't1',
      teamName: 'Neural Knights',
      hackathon: 'Global AI Hackathon',
      userId: 'u-marcus',
      userName: 'Marcus Vance',
      userAvatar: 'https://i.pravatar.cc/150?img=60',
      message: 'Hey Ajay! I specialize in LangChain and vector retrieval. I would love to build the automated reviewer engine with you guys.',
      timestamp: 'Today, 2:15 PM',
      status: 'Pending'
    },
    {
      id: 'req-sample-2',
      teamId: 't1',
      teamName: 'Neural Knights',
      hackathon: 'Global AI Hackathon',
      userId: 'u-ananya',
      userName: 'Ananya Sharma',
      userAvatar: 'https://i.pravatar.cc/150?img=47',
      message: 'Hi team! Full-stack engineer with 3+ hackathon wins. Experienced in Next.js & FastAPI backend architectures.',
      timestamp: 'Today, 3:40 PM',
      status: 'Pending'
    }
  ],
  tp2: [
    {
      id: 'my-req-1',
      teamId: 'tp2',
      teamName: 'Design Dynamos',
      hackathon: 'Global AI Hackathon',
      userId: 'me',
      userName: 'Ajay Yadav',
      userAvatar: 'https://i.pravatar.cc/150?img=12',
      message: 'Hi Elena! I would love to join Design Dynamos to collaborate on Tailwind and UI components.',
      timestamp: 'Today, 11:20 AM',
      status: 'Pending'
    }
  ],
  t2: [
    {
      id: 'my-req-2',
      teamId: 't2',
      teamName: 'Bit Wizards',
      hackathon: 'Algo-Trading Sprint',
      userId: 'me',
      userName: 'Ajay Yadav',
      userAvatar: 'https://i.pravatar.cc/150?img=12',
      message: 'Hey team! Experienced in low-latency C++ and data ingestion pipelines.',
      timestamp: 'Yesterday, 04:15 PM',
      status: 'Accepted'
    }
  ],
  t4: [
    {
      id: 'my-req-3',
      teamId: 't4',
      teamName: 'Cyber Sentinels',
      hackathon: 'Cyber Security Gauntlet',
      userId: 'me',
      userName: 'Ajay Yadav',
      userAvatar: 'https://i.pravatar.cc/150?img=12',
      message: 'Hey Alice! Interested in assisting with authentication and network pen-testing.',
      timestamp: '2 days ago',
      status: 'Rejected'
    }
  ]
};


interface EventsPageProps {
  currentUser?: AuthUser | null;
  selectedDate: number | null;
  setSelectedDate?: (date: number | null) => void;
  isCalendarOpen: boolean;
  setIsCalendarOpen?: (open: boolean) => void;
  interestedIds: Set<string>;
  notInterestedIds: Set<string>;
  registeredIds: Set<string>;
  toggleInterested: (id: string) => void;
  markNotInterested: (id: string) => void;
  handleRegister: (id: string) => void;
  externalExploringId?: string | null;
  onCloseExternalExplorer?: () => void;
  onDetailsToggle?: (isOpen: boolean) => void;
  onEventView?: (id: string) => void;
  viewedEventIds: Set<string>;
  onTeamsViewToggle?: (isOpen: boolean) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ 
  currentUser,
  selectedDate, 
  setSelectedDate,
  isCalendarOpen, 
  setIsCalendarOpen,
  interestedIds, 
  notInterestedIds,
  registeredIds,
  toggleInterested,
  markNotInterested,
  handleRegister,
  externalExploringId,
  onCloseExternalExplorer,
  onDetailsToggle,
  onEventView,
  viewedEventIds,
  onTeamsViewToggle
}) => {
  const [internalCalendarOpen, setInternalCalendarOpen] = useState(isCalendarOpen);
  const [internalSelectedDate, setInternalSelectedDate] = useState<number | null>(selectedDate);

  const effectiveCalendarOpen = setIsCalendarOpen !== undefined ? isCalendarOpen : internalCalendarOpen;
  const handleCalendarToggle = (open: boolean) => {
    if (!open) {
      handleDateSelect(null);
    }
    if (setIsCalendarOpen) {
      setIsCalendarOpen(open);
    } else {
      setInternalCalendarOpen(open);
    }
  };

  const effectiveSelectedDate = setSelectedDate !== undefined ? selectedDate : internalSelectedDate;
  const handleDateSelect = (date: number | null) => {
    if (setSelectedDate) {
      setSelectedDate(date);
    } else {
      setInternalSelectedDate(date);
    }
  };
  const eventsFetcher = useCallback(() => eventsService.list({ limit: 100 }), []);

  // Event data management with full async loading/error/empty lifecycle
  const { 
    events, 
    isLoading, 
    isError, 
    isEmpty, 
    error: loadError, 
    refetch: refetchEvents 
  } = useEventsData({ fetcher: eventsFetcher, fallbackData: EVENTS_MOCK });

  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('tour-closing');
  const [exploringEvent, setExploringEvent] = useState<CampusEvent | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Teams feature state (backed by API)
  const [showTeamsView, setShowTeamsView] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [availableTeamsPool, setAvailableTeamsPool] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [showJoinTeamView, setShowJoinTeamView] = useState(true);

  const loadTeamsData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [myTeams, allAvailable, myReqs] = await Promise.all([
        teamsService.listMyTeams(),
        teamsService.listAvailable(),
        teamsService.listMyRequests(),
      ]);

      setTeams(myTeams);
      setAvailableTeamsPool(allAvailable);

      const hostsMap: Record<string, string> = {};
      myTeams.forEach((t) => {
        hostsMap[t.id] = t.hostId || t.members[0]?.id || currentUser.id;
      });
      setTeamHosts(hostsMap);

      // Load team requests for hosted/admin teams + user's own previous requests
      const reqsByTeam: Record<string, JoinRequest[]> = {};
      myReqs.forEach((r) => {
        reqsByTeam[r.teamId] = [...(reqsByTeam[r.teamId] || []), r];
      });

      await Promise.all(
        myTeams.map(async (t) => {
          try {
            const teamReqs = await teamsService.listTeamRequests(t.id);
            const existingIds = new Set((reqsByTeam[t.id] || []).map((r) => r.id));
            const merged = [...(reqsByTeam[t.id] || [])];
            teamReqs.forEach((tr) => {
              if (!existingIds.has(tr.id)) merged.push(tr);
            });
            reqsByTeam[t.id] = merged;
          } catch {
            // User is not host/admin of this team; skip team-level requests
          }
        })
      );
      setJoinRequests(reqsByTeam);

      setActiveTeam((prev) => {
        if (prev && myTeams.some((t) => t.id === prev.id)) {
          return myTeams.find((t) => t.id === prev.id) || prev;
        }
        return myTeams[0] || null;
      });
    } catch (err) {
      console.error('Failed to load teams data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadTeamsData();
  }, [loadTeamsData]);

  // Whenever the user opens the Teams section, Discover Teams must open by default
  useEffect(() => {
    if (showTeamsView) {
      setShowJoinTeamView(true);
      setShowCreateTeamForm(false);
      setShowTeamMembers(false);
      setPreviewingTeam(null);
      loadTeamsData();
    }
  }, [showTeamsView, loadTeamsData]);

  useEffect(() => {
    onTeamsViewToggle?.(showTeamsView);
  }, [showTeamsView, onTeamsViewToggle]);
  const [discoverySearchQuery, setDiscoverySearchQuery] = useState('');
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    hackathon: '',
    description: '',
    maxMembers: 4
  });
  const [chatInput, setChatInput] = useState('');
  const [teamMessages, setTeamMessages] = useState<Record<string, ChatMessage[]>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch persistent chat messages & subscribe to real-time Socket.IO events for activeTeam
  useEffect(() => {
    if (!activeTeam || !currentUser) return;
    let isCancelled = false;

    chatService
      .listMessages(activeTeam.id)
      .then((msgs) => {
        if (!isCancelled) {
          setTeamMessages((prev) => ({ ...prev, [activeTeam.id]: msgs }));
        }
      })
      .catch((err) => console.error('Failed to load chat history:', err));

    const socket = getSocket();
    if (socket) {
      socket.emit('team:join', activeTeam.id);

      const handleNewMsg = (msg: ChatMessage) => {
        setTeamMessages((prev) => {
          const list = prev[activeTeam.id] || [];
          if (list.some((m) => m.id === msg.id)) return prev;
          return {
            ...prev,
            [activeTeam.id]: [
              ...list,
              { ...msg, isMe: msg.senderId === currentUser.id },
            ],
          };
        });
      };

      const handleDeletedMsg = (payload: {
        messageId: string;
        deleteType: string;
        message?: ChatMessage;
      }) => {
        if (payload.deleteType === 'forEveryone') {
          setTeamMessages((prev) => ({
            ...prev,
            [activeTeam.id]: (prev[activeTeam.id] || []).map((m) =>
              m.id === payload.messageId
                ? {
                    ...m,
                    deletedForEveryone: true,
                    text: 'This message was deleted',
                    audioUrl: undefined,
                    audioDuration: undefined,
                    attachment: undefined,
                  }
                : m
            ),
          }));
        }
      };

      socket.on('message:new', handleNewMsg);
      socket.on('message:deleted', handleDeletedMsg);

      return () => {
        isCancelled = true;
        socket.emit('team:leave', activeTeam.id);
        socket.off('message:new', handleNewMsg);
        socket.off('message:deleted', handleDeletedMsg);
      };
    }

    return () => {
      isCancelled = true;
    };
  }, [activeTeam, currentUser]);

  const sendMessage = useCallback(async (
    customText?: string, 
    audioData?: { url?: string; duration?: number },
    attachmentData?: ChatAttachment
  ) => {
    const textToSend = customText !== undefined ? customText : chatInput;
    if ((!textToSend.trim() && !attachmentData) || !activeTeam) return;

    try {
      const sent = await chatService.sendMessage(activeTeam.id, {
        content: textToSend.trim(),
        messageType: attachmentData ? 'ATTACHMENT' : audioData ? 'AUDIO' : 'TEXT',
        audioUrl: audioData?.url,
        audioDuration: audioData?.duration,
        attachmentId: attachmentData?.id,
      });

      setTeamMessages((prev) => {
        const list = prev[activeTeam.id] || [];
        if (list.some((m) => m.id === sent.id)) return prev;
        return { ...prev, [activeTeam.id]: [...list, sent] };
      });
      setChatInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }, [chatInput, activeTeam]);

  const handleDeleteMessage = useCallback(async (
    teamId: string,
    messageId: string,
    deleteType: 'forMe' | 'forEveryone',
    userId: string = currentUser?.id || 'me'
  ) => {
    try {
      await chatService.deleteMessage(messageId, deleteType);
      setTeamMessages((prev) => {
        const currentMsgs = prev[teamId] || [];
        if (deleteType === 'forEveryone') {
          return {
            ...prev,
            [teamId]: currentMsgs.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    deletedForEveryone: true,
                    text: 'This message was deleted',
                    audioUrl: undefined,
                    audioDuration: undefined,
                    attachment: undefined,
                  }
                : m
            ),
          };
        }
        return {
          ...prev,
          [teamId]: currentMsgs.filter((m) => m.id !== messageId),
        };
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  }, [currentUser]);

  // Keep the page scroll container at top when a team is selected so the team header remains visible
  useEffect(() => {
    if (activeTeam && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTeam]);

  // Host & Rating state
  const [teamHosts, setTeamHosts] = useState<Record<string, string>>({});
  const [removedMembers, setRemovedMembers] = useState<Record<string, Set<string>>>({});
  const [confirmRemoveTarget, setConfirmRemoveTarget] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');

  // Join Request State
  const [joinRequests, setJoinRequests] = useState<Record<string, JoinRequest[]>>({});
  const [previewingTeam, setPreviewingTeam] = useState<Team | null>(null);
  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSentToast, setRequestSentToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'Chat' | 'Members' | 'Requests'>('Chat');
  const [submittedRatings, setSubmittedRatings] = useState<Record<string, { stars: number; feedback: string }>>({});
  const [ratingToast, setRatingToast] = useState(false);

  const isHost = activeTeam && currentUser ? teamHosts[activeTeam.id] === currentUser.id : false;

  const handleRemoveMember = useCallback(async (teamId: string, memberId: string) => {
    try {
      await teamsService.removeMember(teamId, memberId);
      setRemovedMembers(prev => {
        const s = new Set(prev[teamId] || []);
        s.add(memberId);
        return { ...prev, [teamId]: s };
      });
      await loadTeamsData();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  }, [loadTeamsData]);

  const handleMakeHost = useCallback(async (teamId: string, memberId: string) => {
    try {
      await teamsService.makeHost(teamId, memberId);
      setTeamHosts(prev => ({ ...prev, [teamId]: memberId }));
      await loadTeamsData();
    } catch (err) {
      console.error('Failed to transfer host role:', err);
    }
  }, [loadTeamsData]);

  const handleSubmitRating = useCallback(async () => {
    if (!ratingTarget || ratingStars === 0 || !activeTeam) return;
    try {
      await teamsService.rateMember(activeTeam.id, ratingTarget, ratingStars, ratingFeedback);
      setSubmittedRatings(prev => ({ ...prev, [ratingTarget]: { stars: ratingStars, feedback: ratingFeedback } }));
      setRatingTarget(null);
      setRatingStars(0);
      setRatingFeedback('');
      setRatingToast(true);
      setTimeout(() => setRatingToast(false), 2500);
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  }, [ratingTarget, ratingStars, ratingFeedback, activeTeam]);

  const handleSendJoinRequest = async (team: Team) => {
    setIsSendingRequest(true);
    try {
      const createdReq = await teamsService.createJoinRequest(
        team.id,
        joinRequestMessage.trim() || `Hi, I'd like to join ${team.name}!`
      );
      setJoinRequests(prev => ({
        ...prev,
        [team.id]: [...(prev[team.id] || []), createdReq]
      }));
      setJoinRequestMessage('');
      setPreviewingTeam(null);
      setRequestSentToast(true);
      setTimeout(() => setRequestSentToast(false), 3000);
    } catch (err) {
      console.error('Failed to submit join request:', err);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleAcceptRequest = async (request: JoinRequest) => {
    try {
      const updated = await teamsService.acceptRequest(request.id);
      setJoinRequests(prev => ({
        ...prev,
        [request.teamId]: (prev[request.teamId] || []).map(r =>
          r.id === request.id ? updated : r
        )
      }));
      await loadTeamsData();
    } catch (err) {
      console.error('Failed to accept join request:', err);
    }
  };

  const handleRejectRequest = async (request: JoinRequest) => {
    try {
      const updated = await teamsService.rejectRequest(request.id);
      setJoinRequests(prev => ({
        ...prev,
        [request.teamId]: (prev[request.teamId] || []).map(r =>
          r.id === request.id ? updated : r
        )
      }));
    } catch (err) {
      console.error('Failed to reject join request:', err);
    }
  };

  // Immediate scroll detection with threshold for compact card layout
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // If on Teams view, button must never be shown
    if (showTeamsView) {
      setShowBackToTop(false);
      return;
    }

    const currentScrollTop = e.currentTarget.scrollTop;

    // Immediately hide when user scrolls near the top; show when scrolled down
    if (currentScrollTop <= 100) {
      setShowBackToTop(false);
    } else if (currentScrollTop > 180) {
      setShowBackToTop(true);
    }
  }, [showTeamsView]);

  const scrollToTop = useCallback(() => {
    setShowBackToTop(false);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Reset state on unmount
  useEffect(() => {
    return () => {
      setShowBackToTop(false);
    };
  }, []);

  // Ensure button is immediately hidden when entering Teams view or exploring an event
  useEffect(() => {
    if (showTeamsView || exploringEvent) {
      setShowBackToTop(false);
    }
  }, [showTeamsView, exploringEvent]);
  
  // Removed the 30-second top-level state interval. 
  // Calling setNow(new Date()) every 30s was forcing the entire EventsPage 
  // (and all hundreds of child components/cards) to re-render, causing massive lag spikes.
  // Instead, we just capture 'now' once when the component mounts or when relevant.
  const now = useMemo(() => new Date(), []);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPeersModal, setShowPeersModal] = useState(false);
  const [invitedPeersMap, setInvitedPeersMap] = useState<Record<string, Set<string>>>({});
  const [showOnlyInterested, setShowOnlyInterested] = useState(false);

  const isRegistered = exploringEvent ? registeredIds.has(exploringEvent.id) : false;
  const isInterested = exploringEvent ? interestedIds.has(exploringEvent.id) : false;
  const isNotInterested = exploringEvent ? notInterestedIds.has(exploringEvent.id) : false;
  const isExploringEventPast = exploringEvent ? exploringEvent.dayOfMonth < TODAY_DAY : false;

  useEffect(() => {
    if (externalExploringId) {
      const sourceEvents = events.length > 0 ? events : EVENTS_MOCK;
      const event = sourceEvents.find(e => e.id === externalExploringId);
      if (event) {
        setExploringEvent(event);
        onEventView?.(event.id);
      }
    }
  }, [externalExploringId, events, onEventView]);

  useEffect(() => {
    onDetailsToggle?.(!!exploringEvent);
    return () => onDetailsToggle?.(false);
  }, [exploringEvent, onDetailsToggle]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeExplorer();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const closeExplorer = useCallback(() => {
    setExploringEvent(null);
    onCloseExternalExplorer?.();
    setShowConfirmModal(false);
    setShowSuccessModal(false);
    setShowPeersModal(false);
  }, [onCloseExternalExplorer]);

  const handleInvitePeer = useCallback((peerId: string) => {
    if (!exploringEvent) return;
    setInvitedPeersMap(prev => {
      const current = prev[exploringEvent.id] || new Set();
      const next = new Set(current);
      next.add(peerId);
      return { ...prev, [exploringEvent.id]: next };
    });
  }, [exploringEvent]);

  const confirmRegistration = useCallback(() => {
    if (!exploringEvent) return;
    handleRegister(exploringEvent.id);
    setShowConfirmModal(false);
    setShowSuccessModal(true);
  }, [exploringEvent, handleRegister]);

  const filteredData = useMemo(() => {
    const sourceEvents = (events && events.length > 0) ? events : EVENTS_MOCK;
    return sourceEvents.filter(e => {
      const matchesCategory = selectedCategories.length === 0 
        ? (activeFilter === 'All' || e.category === activeFilter)
        : selectedCategories.includes(e.category);
      const matchesSearch = searchQuery.trim() === '' ? true : e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = effectiveSelectedDate ? e.dayOfMonth === effectiveSelectedDate : true;
      const matchesInterested = showOnlyInterested ? interestedIds.has(e.id) : true;
      return matchesCategory && matchesSearch && matchesDate && matchesInterested;
    }).sort((a, b) => {
      const getPriority = (id: string) => {
        if (registeredIds.has(id) || interestedIds.has(id)) return 2;
        if (notInterestedIds.has(id)) return 0;
        return 1;
      };
      const priorityDiff = getPriority(b.id) - getPriority(a.id);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort: parse dates for timeline order
      const dateA = parseDateTime(a.date, a.time);
      const dateB = parseDateTime(b.date, b.time);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });
  }, [events, selectedCategories, activeFilter, searchQuery, effectiveSelectedDate, registeredIds, interestedIds, notInterestedIds, showOnlyInterested]);

  const categories = useMemo(() => {
    const nearDeadline = filteredData.filter(e => {
      const d = parseDateTime(e.date, e.time);
      if (!d) return false;
      const diff = d.getTime() - now.getTime();
      return diff > 0 && diff <= (3 * 24 * 60 * 60 * 1000); // within 3 days
    });
    const upcoming = filteredData.filter(e => {
      const d = parseDateTime(e.date, e.time);
      if (!d) return false;
      const diff = d.getTime() - now.getTime();
      return diff > (3 * 24 * 60 * 60 * 1000); // more than 3 days
    });
    const past = filteredData.filter(e => {
      const d = parseDateTime(e.date, e.time);
      if (!d) return false;
      const diff = d.getTime() - now.getTime();
      return diff <= 0;
    });
    return { nearDeadline, upcoming, past };
  }, [filteredData, now]);

  const onRegisterClick = () => {
    setShowConfirmModal(true);
  };


  const handleCreateTeam = async () => {
    if (!newTeamData.name) return;
    try {
      const created = await teamsService.createTeam({
        name: newTeamData.name,
        hackathon: newTeamData.hackathon || 'Campus Project',
        description: newTeamData.description,
        maxMembers: newTeamData.maxMembers || 4,
      });
      setTeams((prev) => [created, ...prev]);
      setAvailableTeamsPool((prev) => [created, ...prev]);
      setTeamHosts((prev) => ({ ...prev, [created.id]: currentUser?.id || 'me' }));
      setActiveTeam(created);
      setShowCreateTeamForm(false);
      setNewTeamData({ name: '', hackathon: '', description: '', maxMembers: 4 });
    } catch (err) {
      console.error('Failed to create team:', err);
    }
  };

  const handleExploreEvent = useCallback((event: CampusEvent) => {
    setExploringEvent(event);
    onEventView?.(event.id);
  }, [onEventView]);

  return (
    <div className="relative flex-1 min-w-0 w-full h-full overflow-hidden flex flex-col">
      {/* 1. Static Layout: EventsHeader is ALWAYS mounted at the top, full-width, visible, and interactive */}
      {!showTeamsView && (
        <div className="w-full shrink-0 z-30 bg-white">
          <EventsHeader 
            showTeamsView={showTeamsView}
            setShowTeamsView={setShowTeamsView}
            setActiveTeam={setActiveTeam}
            setShowTeamMembers={setShowTeamMembers}
            setShowCreateTeamForm={setShowCreateTeamForm}
            setShowJoinTeamView={setShowJoinTeamView}
            teams={teams}
            showCreateTeamForm={showCreateTeamForm}
            showJoinTeamView={showJoinTeamView}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            showOnlyInterested={showOnlyInterested}
            setShowOnlyInterested={setShowOnlyInterested}
          />
        </div>
      )}

      {/* 2. Main Content Area below Event Page Header */}
      <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-row relative">
        {/* Main Events Content Column */}
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden relative">
          <div 
            id="events-page-scroll-container"
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`flex-1 flex flex-col transition-all ${
              showTeamsView ? 'overflow-hidden w-full h-full' : 'pb-32 overflow-y-auto max-w-7xl mx-auto w-full h-full'
            } relative`}
          >
            {/* Background Decorative Accents */}
            {!showTeamsView && (
              <>
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
                <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-blue-50/20 rounded-full blur-[100px] pointer-events-none -z-10" />
              </>
            )}

            {/* 2. Team Portal View */}
            {showTeamsView && (
              <div className="flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden bg-white">
          <TeamPortal 
            availableEvents={events.length > 0 ? events : EVENTS_MOCK}
            activeTeam={activeTeam}
            setActiveTeam={setActiveTeam}
            showCreateTeamForm={showCreateTeamForm}
            setShowCreateTeamForm={setShowCreateTeamForm}
            showJoinTeamView={showJoinTeamView}
            setShowJoinTeamView={setShowJoinTeamView}
            teams={teams}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            teamHosts={teamHosts}
            joinRequests={joinRequests}
            setTeams={setTeams}
            removedMembers={removedMembers}
            submittedRatings={submittedRatings}
            handleMakeHost={handleMakeHost}
            setConfirmRemoveTarget={setConfirmRemoveTarget}
            confirmRemoveTarget={confirmRemoveTarget}
            handleRemoveMember={handleRemoveMember}
            setRatingTarget={setRatingTarget}
            ratingTarget={ratingTarget}
            setRatingStars={setRatingStars}
            ratingStars={ratingStars}
            setRatingFeedback={setRatingFeedback}
            ratingFeedback={ratingFeedback}
            handleSubmitRating={handleSubmitRating}
            teamMessages={teamMessages}
            handleDeleteMessage={handleDeleteMessage}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendMessage={sendMessage}
            chatEndRef={chatEndRef}
            handleAcceptRequest={handleAcceptRequest}
            handleRejectRequest={handleRejectRequest}
            teamSearchQuery={discoverySearchQuery}
            setTeamSearchQuery={setDiscoverySearchQuery}
            filteredTeamsPool={availableTeamsPool.filter(t => !teams.some(myT => myT.id === t.id))}
            previewingTeam={previewingTeam}
            setPreviewingTeam={setPreviewingTeam}
            joinRequestMessage={joinRequestMessage}
            setJoinRequestMessage={setJoinRequestMessage}
            handleSendJoinRequest={handleSendJoinRequest}
            isSendingRequest={isSendingRequest}
            newTeamData={newTeamData}
            setNewTeamData={setNewTeamData}
            handleCreateTeam={handleCreateTeam}
            setShowTeamsView={setShowTeamsView}
          />
        </div>
      )}

      {/* 3. API-Driven Data Feed Section: Displays Loading State ONLY Here */}
      {!showTeamsView && (
        isLoading ? (
          <EventsFeedSkeleton isCalendarOpen={effectiveCalendarOpen} />
        ) : isError ? (
          <EventsErrorScreen error={loadError} onRetry={refetchEvents} />
        ) : isEmpty ? (
          <EventsEmptyScreen onRefresh={refetchEvents} />
        ) : (
          <EventsDiscovery 
            showTeamsView={showTeamsView}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            selectedStatuses={selectedStatuses}
            onClearAllFilters={() => {
              setSelectedCategories([]);
              setSelectedStatuses([]);
              setShowOnlyInterested(false);
            }}
            closingSoonEvents={categories.nearDeadline}
            upcomingEvents={categories.upcoming}
            pastEvents={categories.past}
            interestedIds={interestedIds}
            notInterestedIds={notInterestedIds}
            registeredIds={registeredIds}
            toggleInterested={toggleInterested}
            markNotInterested={markNotInterested}
            todayDay={TODAY_DAY}
            now={now}
            onExplore={handleExploreEvent}
            isCalendarOpen={effectiveCalendarOpen}
          />
        )
      )}

      <SharedModals 
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        exploringEvent={exploringEvent}
        confirmRegistration={confirmRegistration}
        showSuccessModal={showSuccessModal}
        setShowSuccessModal={setShowSuccessModal}
        setShowPeersModal={setShowPeersModal}
        showPeersModal={showPeersModal}
        invitedPeersMap={invitedPeersMap}
        onInvitePeer={handleInvitePeer}
        PEERS_MOCK={PEERS_MOCK}
      />

      {/* Request Sent Toast */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[2500] transition-all  ${
        requestSentToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4">
          <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">
             <Check className="w-5 h-5" />
          </div>
          <div>
             <p className="text-sm font-bold">Request Sent!</p>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wait for host approval</p>
          </div>
        </div>
      </div>
    </div>

    {/* Event Details View: strictly inside the main events content area below EventsHeader */}
    {exploringEvent && (
      <EventDetailsModal 
        exploringEvent={exploringEvent}
        closeExplorer={closeExplorer}
        isExploringEventPast={exploringEvent.dayOfMonth < TODAY_DAY}
        isRegistered={registeredIds.has(exploringEvent.id)}
        setShowPeersModal={setShowPeersModal}
        onRegisterClick={onRegisterClick}
        isInterested={interestedIds.has(exploringEvent.id)}
        toggleInterested={toggleInterested}
        isNotInterested={notInterestedIds.has(exploringEvent.id)}
        markNotInterested={markNotInterested}
      />
    )}

    {/* Centered Floating Back to Top Button aligned with Events page actual content boundaries */}
    {!showTeamsView && !exploringEvent && (
      <div className="absolute bottom-6 sm:bottom-7 inset-x-0 pointer-events-none max-w-7xl mx-auto w-full z-[9999] flex justify-center">
        <BackToTop 
          showBackToTop={showBackToTop} 
          scrollToTop={scrollToTop} 
        />
      </div>
    )}

    {/* Floating Calendar Option in Bottom-Right Corner (Only shown when calendar and event details are closed) */}
    {!showTeamsView && !effectiveCalendarOpen && !exploringEvent && (
      <button 
        id="tour-calendar"
        type="button"
        onClick={() => handleCalendarToggle(true)}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 rounded-[28px] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)] transition-all group border-2 border-white/20 bg-gradient-to-br from-blue-600 to-sky-500 hover:scale-110 active:scale-95 hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.6)] cursor-pointer"
        title="Open Calendar"
        aria-label="Open Calendar"
      >
        <CalendarIcon className="w-7 h-7 text-white transition-transform" />
        <div className="absolute top-0 right-0 w-4 h-4 bg-white border-[3px] border-blue-600 rounded-full animate-bounce shadow-sm" />
      </button>
    )}
  </div>

    {/* Side-by-Side Calendar View (Height excludes EventsHeader) */}
    {!showTeamsView && effectiveCalendarOpen && (
      <MiniFloatingCalendar 
        isOpen={effectiveCalendarOpen} 
        setIsOpen={handleCalendarToggle}
        selectedDate={effectiveSelectedDate}
        setSelectedDate={handleDateSelect}
        events={events.length > 0 ? events : EVENTS_MOCK}
        interestedIds={interestedIds}
        registeredIds={registeredIds}
      />
    )}
  </div>
</div>
);
};
