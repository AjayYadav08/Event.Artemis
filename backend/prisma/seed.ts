import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Event Artemis database...');

  const passwordHash = await bcrypt.hash('Artemis@123', 12);

  // 1. Seed Users
  const ajay = await prisma.user.upsert({
    where: { email: 'ajay@artemis.events' },
    update: {},
    create: {
      name: 'Ajay Yadav',
      email: 'ajay@artemis.events',
      passwordHash,
      role: 'ADMIN',
      profileImage: '/avatar.png',
      skills: ['Full-Stack', 'React', 'TypeScript', 'Node.js'],
      xp: 4850,
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@artemis.events' },
    update: {},
    create: {
      name: 'Sarah Chen',
      email: 'sarah@artemis.events',
      passwordHash,
      role: 'ORGANIZER',
      profileImage: 'https://i.pravatar.cc/150?img=5',
      skills: ['PyTorch', 'MLOps', 'Python'],
      xp: 3200,
    },
  });

  const zoe = await prisma.user.upsert({
    where: { email: 'zoe@artemis.events' },
    update: {},
    create: {
      name: 'Zoe Patel',
      email: 'zoe@artemis.events',
      passwordHash,
      role: 'STUDENT',
      profileImage: 'https://i.pravatar.cc/150?img=9',
      skills: ['FastAPI', 'UI/UX', 'Figma'],
      xp: 2700,
    },
  });

  const mike = await prisma.user.upsert({
    where: { email: 'mike@artemis.events' },
    update: {},
    create: {
      name: 'Mike Ross',
      email: 'mike@artemis.events',
      passwordHash,
      role: 'STUDENT',
      profileImage: 'https://i.pravatar.cc/150?img=11',
      skills: ['Rust', 'Solidity', 'Web3'],
      xp: 2450,
    },
  });

  // 2. Seed Events (only if none exist yet)
  const existingEvents = await prisma.event.count();
  if (existingEvents === 0) {
    const eventsData = [
      {
        title: 'Flash Code Sprint',
        category: 'Competition' as const,
        type: 'Live' as const,
        date: '12 May 2026',
        dayOfMonth: 12,
        time: '06:00 PM',
        eventDate: new Date('2026-05-12T18:00:00Z'),
        registrationDeadline: new Date('2026-05-11T23:59:00Z'),
        location: 'Server Room 404',
        campus: 'Main Campus',
        domain: 'Competitive Programming',
        conductingAgency: 'ACM Student Chapter',
        locationType: 'OnCampus' as const,
        participationMode: 'Online' as const,
        teamMode: 'Solo' as const,
        xp: 5000,
        attendees: 50,
        sectionParticipants: 5,
        featured: true,
        prizePool: '₹50,000 Instant',
        tracks: ['Speed Coding', 'Bug Fixing'],
        posterUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000',
        description: 'A surprise lightning round of competitive programming. The clock is ticking, and the deadline is approaching fast.',
        jokes: ['Code faster, the server bills are due.', 'Urgent? I thought you said URGENT.'],
        timeline: [{ time: '06:00 PM', title: 'Sprint Start', desc: 'Go go go!' }],
        venueDetails: 'Server Room 404',
        eligibility: 'Speedsters',
        teamSize: 'Individual',
        certification: true,
        organizerContact: { phone: '+1 (555) 987-6543', email: 'flash@artemis.events' },
        isPaid: false,
        registrationFee: 'Free',
        duration: '2 Hours',
        rounds: ['Problem Reveal', 'Coding Sprint', 'Evaluation'],
        dos: ['Prepare your environment', 'Check your internet', 'Focus on efficiency'],
        donts: ['No external help', 'No code sharing during the sprint'],
        rules: ['Individual participation only.', 'Solutions must be submitted within the time limit.'],
        createdById: sarah.id,
      },
      {
        title: 'UI Design Jam',
        category: 'Workshop' as const,
        type: 'Upcoming' as const,
        date: '12 May 2026',
        dayOfMonth: 12,
        time: '10:00 AM',
        eventDate: new Date('2026-05-12T10:00:00Z'),
        registrationDeadline: new Date('2026-05-11T23:59:00Z'),
        location: 'Design Lab',
        campus: 'Arts Block',
        domain: 'UI/UX Design',
        conductingAgency: 'Design Guild',
        locationType: 'OnCampus' as const,
        participationMode: 'Offline' as const,
        teamMode: 'Solo' as const,
        xp: 1500,
        attendees: 45,
        sectionParticipants: 8,
        prizePool: '₹5,000',
        tracks: ['Prototyping', 'Design Ops'],
        posterUrl: 'https://images.unsplash.com/photo-1541462608141-ad60397d5873?auto=format&fit=crop&q=80&w=1000',
        description: 'A rapid prototyping challenge. Show us your best workflow.',
        jokes: ['Iterate or die.'],
        timeline: [{ time: '10:00 AM', title: 'Kickoff', desc: 'Start jamming!' }],
        venueDetails: 'Room 101, Arts Block.',
        eligibility: 'Designers',
        teamSize: 'Individual',
        certification: true,
        organizerContact: { phone: '+91 12345 67890', email: 'jam@artemis.events' },
        isPaid: false,
        registrationFee: 'Free',
        duration: '4 Hours',
        rounds: ['Kickoff', 'Design Phase', 'Review'],
        dos: ['Bring your laptop'],
        donts: ["Don't skip research"],
        rules: ['Figma only.'],
        createdById: sarah.id,
      },
      {
        title: 'Cloud Security Challenge',
        category: 'Competition' as const,
        type: 'Upcoming' as const,
        date: '13 May 2026',
        dayOfMonth: 13,
        time: '02:00 PM',
        eventDate: new Date('2026-05-13T14:00:00Z'),
        registrationDeadline: new Date('2026-05-12T23:59:00Z'),
        location: 'Cyber Hub',
        campus: 'Block D',
        domain: 'Cybersecurity',
        conductingAgency: 'SecOps Club',
        locationType: 'OnCampus' as const,
        participationMode: 'Online' as const,
        teamMode: 'Both' as const,
        xp: 2500,
        attendees: 120,
        sectionParticipants: 15,
        prizePool: '₹25,000',
        tracks: ['AWS Security', 'Pen-testing'],
        posterUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000',
        description: 'Find the vulnerabilities in our cloud infrastructure before the time runs out.',
        jokes: ['403 Forbidden is my favorite status code.'],
        timeline: [{ time: '02:00 PM', title: 'Target Reveal', desc: 'Go!' }],
        venueDetails: 'Block D, 2nd Floor.',
        eligibility: 'Security Enthusiasts',
        teamSize: 'Individual or Pairs',
        certification: true,
        organizerContact: { phone: '+91 09876 54321', email: 'security@artemis.events' },
        isPaid: false,
        registrationFee: 'Free',
        duration: '6 Hours',
        rounds: ['Recon', 'Exploit', 'Report'],
        dos: ['Be ethical'],
        donts: ['No destructive attacks'],
        rules: ['Standard CTF rules.'],
        createdById: sarah.id,
      },
      {
        title: 'AI Ethics Debate',
        category: 'Seminar' as const,
        type: 'Upcoming' as const,
        date: '8 May 2026',
        dayOfMonth: 8,
        time: '02:00 PM',
        eventDate: new Date('2026-05-08T14:00:00Z'),
        registrationDeadline: new Date('2026-05-07T23:59:00Z'),
        location: 'Main Hall',
        campus: 'Main Campus',
        domain: 'AI & Ethics',
        conductingAgency: 'AI Society',
        locationType: 'OnCampus' as const,
        participationMode: 'Offline' as const,
        teamMode: 'Both' as const,
        xp: 1200,
        attendees: 150,
        sectionParticipants: 10,
        prizePool: '₹10,000',
        tracks: ['Ethics', 'AI Policy'],
        posterUrl: 'https://images.unsplash.com/photo-1591115765373-520b7a6f7104?auto=format&fit=crop&q=80&w=1000',
        description: 'Discussing the philosophical and legal implications of autonomous agents.',
        jokes: ['My AI told me it has no comment on this debate.'],
        timeline: [{ time: '02:00 PM', title: 'Opening', desc: 'Intro to AI Ethics.' }],
        venueDetails: 'Main Hall, Level 2.',
        eligibility: 'All Students',
        teamSize: '1-2 Members',
        certification: true,
        organizerContact: { phone: '+91 98765 43210', email: 'ethics@campus.edu' },
        isPaid: false,
        registrationFee: 'Free',
        duration: '3 Hours',
        rounds: ['Opening', 'Debate', 'Conclusion'],
        dos: ['Research beforehand', 'Be respectful'],
        donts: ['No AI-generated arguments'],
        rules: ['Standard debate rules apply.'],
        createdById: sarah.id,
      },
      {
        title: 'GenAI Builders Hackathon',
        category: 'Competition' as const,
        type: 'Upcoming' as const,
        date: '30 May 2026',
        dayOfMonth: 30,
        time: '09:00 AM',
        eventDate: new Date('2026-05-30T09:00:00Z'),
        registrationDeadline: new Date('2026-05-28T23:59:00Z'),
        location: 'Innovation Hub',
        campus: 'Tech Park',
        domain: 'Artificial Intelligence',
        conductingAgency: 'Google Developer Group',
        locationType: 'OnCampus' as const,
        participationMode: 'Hybrid' as const,
        teamMode: 'Team' as const,
        xp: 4500,
        attendees: 280,
        sectionParticipants: 30,
        featured: true,
        prizePool: '₹1,50,000',
        tracks: ['LLM Agents', 'Multimodal AI', 'DevTools'],
        posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000',
        description: '24-hour flagship hackathon building production-ready AI applications and autonomous workflows.',
        jokes: ['Prompt engineering is just negotiating with math.'],
        timeline: [
          { time: '09:00 AM', title: 'Check-in', desc: 'Registration & coffee' },
          { time: '11:00 AM', title: 'Hacking Begins', desc: 'Build your prototype' },
        ],
        venueDetails: 'Innovation Hub, Ground Floor',
        eligibility: 'Open to all UG/PG students',
        teamSize: '2-4 Members',
        certification: true,
        organizerContact: { phone: '+91 98111 22334', email: 'genai@artemis.events' },
        isPaid: false,
        registrationFee: 'Free',
        duration: '24 Hours',
        rounds: ['Ideation', 'Prototype Sprint', 'Demo Day'],
        dos: ['Bring chargers', 'Commit code regularly'],
        donts: ['No pre-built projects'],
        rules: ['Teams of 2-4 only.'],
        createdById: sarah.id,
      },
      {
        title: 'Summer Robotics Expo',
        category: 'Fest' as const,
        type: 'Upcoming' as const,
        date: '5 Jun 2026',
        dayOfMonth: 5,
        time: '11:00 AM',
        eventDate: new Date('2026-06-05T11:00:00Z'),
        registrationDeadline: new Date('2026-06-04T23:59:00Z'),
        location: 'Central Arena',
        campus: 'Main Campus',
        domain: 'Robotics & IoT',
        conductingAgency: 'Mechatronics Lab',
        locationType: 'OnCampus' as const,
        participationMode: 'Offline' as const,
        teamMode: 'Team' as const,
        xp: 2000,
        attendees: 400,
        sectionParticipants: 40,
        prizePool: '₹75,000',
        tracks: ['Autonomous Rovers', 'Drone Racing'],
        posterUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000',
        description: 'Showcase your custom robots, autonomous rovers, and embedded IoT prototypes.',
        jokes: ['My robot only follows orders when it feels like it.'],
        timeline: [{ time: '11:00 AM', title: 'Expo Opens', desc: 'Booth setup and demos' }],
        venueDetails: 'Central Arena, Main Campus',
        eligibility: 'All Engineering Students',
        teamSize: '2-5 Members',
        certification: true,
        organizerContact: { phone: '+91 98222 33445', email: 'robotics@artemis.events' },
        isPaid: false,
        registrationFee: 'Free',
        duration: '8 Hours',
        rounds: ['Inspection', 'Arena Trials', 'Finals'],
        dos: ['Test battery safety'],
        donts: ['No hazardous materials'],
        rules: ['Max robot weight 5kg.'],
        createdById: sarah.id,
      },
      {
        title: 'Web3 Hackathon 2026',
        category: 'Competition' as const,
        type: 'Upcoming' as const,
        date: '20 Nov 2026',
        dayOfMonth: 20,
        time: '10:00 AM',
        eventDate: new Date('2026-11-20T10:00:00Z'),
        registrationDeadline: new Date('2026-11-18T23:59:00Z'),
        location: 'Crypto Lab',
        campus: 'Block C',
        domain: 'Blockchain/Web3',
        conductingAgency: 'Blockchain Club',
        locationType: 'OnCampus' as const,
        participationMode: 'Hybrid' as const,
        teamMode: 'Team' as const,
        xp: 3000,
        attendees: 300,
        sectionParticipants: 25,
        prizePool: '₹2,00,000',
        tracks: ['DeFi', 'ZK Proofs', 'DAOs'],
        posterUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f4ecb3c?auto=format&fit=crop&q=80&w=1000',
        description: 'Build the future of decentralized finance and verifiable computing.',
        jokes: ['WAGMI, but only if you ship.'],
        timeline: [{ time: '10:00 AM', title: 'Kickoff', desc: 'Rules and API keys.' }],
        venueDetails: 'Block C, 3rd Floor.',
        eligibility: 'Developers',
        teamSize: '1-4 Members',
        certification: true,
        organizerContact: { phone: '+91 98333 44556', email: 'web3@artemis.events' },
        isPaid: false,
        registrationFee: 'Free',
        duration: '36 Hours',
        rounds: ['Build', 'Audit', 'Pitch'],
        dos: ['Deploy on testnet'],
        donts: ['No mainnet real funds'],
        rules: ['Open source code required.'],
        createdById: sarah.id,
      },
    ];

    for (const ev of eventsData) {
      await prisma.event.create({ data: ev });
    }
  }

  // 3. Seed Teams & Chats (only if none exist)
  const existingTeams = await prisma.team.count();
  if (existingTeams === 0) {
    const quantumTeam = await prisma.team.create({
      data: {
        name: 'Quantum Coders',
        hackathon: 'GenAI Builders Hackathon',
        description: 'Building an autonomous campus event agent and real-time study assistant.',
        goals: 'Ship a working multi-agent MVP with sub-second latency.',
        expectations: ['Active daily check-ins', 'Clean TypeScript PRs', 'Available for 24h sprint'],
        maxMembers: 4,
        recruitmentStatus: 'Open',
        location: 'Innovation Hub, Block A',
        createdById: ajay.id,
        memberships: {
          create: [
            { userId: ajay.id, role: 'HOST', memberRoleTitle: 'Team Lead', skills: ['Full-Stack', 'TypeScript'] },
            { userId: sarah.id, role: 'ADMIN', memberRoleTitle: 'AI Engineer', skills: ['PyTorch', 'NLP'] },
            { userId: zoe.id, role: 'MEMBER', memberRoleTitle: 'Backend & UI', skills: ['FastAPI', 'Figma'] },
          ],
        },
        messages: {
          create: [
            {
              senderId: sarah.id,
              content: 'Hey team! Just finished the baseline model.',
              messageType: 'TEXT',
            },
            {
              senderId: ajay.id,
              content: 'Awesome! I am working on the frontend integration.',
              messageType: 'TEXT',
            },
            {
              senderId: zoe.id,
              content: 'Great! Should I start setting up the API endpoints?',
              messageType: 'TEXT',
            },
          ],
        },
      },
    });

    const web3Team = await prisma.team.create({
      data: {
        name: 'Neural Ninjas',
        hackathon: 'Web3 Hackathon 2026',
        description: 'Exploring zero-knowledge identity proofs for campus credentials.',
        goals: 'Deploy ZK verifier on testnet and build React frontend.',
        expectations: ['Familiarity with Solidity or Rust', 'Collaborative mindset'],
        maxMembers: 4,
        recruitmentStatus: 'Open',
        location: 'Crypto Lab, Block C',
        createdById: mike.id,
        memberships: {
          create: [
            { userId: mike.id, role: 'HOST', memberRoleTitle: 'Protocol Lead', skills: ['Rust', 'Solidity'] },
          ],
        },
        messages: {
          create: [
            {
              senderId: mike.id,
              content: 'Welcome to Neural Ninjas! Let us know which track you want to tackle.',
              messageType: 'TEXT',
            },
          ],
        },
      },
    });

    const designTeam = await prisma.team.create({
      data: {
        name: 'Design Mavericks',
        hackathon: 'UI Design Jam',
        description: 'Crafting delightful accessible interfaces and micro-interactions.',
        expectations: ['Figma experience', 'Attention to typography'],
        maxMembers: 3,
        recruitmentStatus: 'Open',
        location: 'Design Lab, Arts Block',
        createdById: zoe.id,
        memberships: {
          create: [
            { userId: zoe.id, role: 'HOST', memberRoleTitle: 'Design Lead', skills: ['Figma', 'Design Systems'] },
          ],
        },
      },
    });

    // Seed sample join requests (Pending, Accepted, Rejected) for Previous Join Requests tab
    await prisma.teamJoinRequest.createMany({
      data: [
        {
          teamId: web3Team.id,
          userId: ajay.id,
          message: 'Would love to help build the React + Wagmi frontend for your ZK verifier!',
          status: 'Pending',
        },
        {
          teamId: designTeam.id,
          userId: ajay.id,
          message: 'Can help with interactive prototypes and animations.',
          status: 'Rejected',
        },
        {
          teamId: quantumTeam.id,
          userId: mike.id,
          message: 'Interested in helping optimize the inference pipeline in Rust!',
          status: 'Pending',
        },
      ],
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

