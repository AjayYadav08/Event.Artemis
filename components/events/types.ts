import { TutorialStep } from '../TutorialOverlay';

export interface TimelineItem {
  time: string;
  title: string;
  desc: string;
}

export interface Prize {
  title: string;
  desc: string;
  amount: string;
  color: string;
}

export interface Sponsor {
  name: string;
  tier: 'Platinum' | 'Gold' | 'Silver';
  logoUrl?: string;
}

export interface Judge {
  name: string;
  role: string;
  company: string;
  avatarUrl: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface CampusEvent {
  id: string;
  title: string;
  category: 'Competition' | 'Fest' | 'Workshop' | 'Seminar';
  type: 'Live' | 'Upcoming' | 'Closed' | 'Past';
  date: string;
  dayOfMonth: number;
  time: string;
  location: string;
  domain: string;
  conductingAgency?: string;
  locationType?: 'On-Campus' | 'Off-Campus';
  registrationWindow?: string;
  xp: number;
  attendees: number;
  sectionParticipants: number; 
  featured?: boolean;
  description?: string;
  jokes: string[];
  timeline: TimelineItem[];
  venueDetails: string;
  prizePool?: string;
  tracks?: string[];
  posterUrl: string;
  eligibility: string;
  teamSize: string;
  certification: boolean;
  prizesList?: Prize[];
  sponsors?: Sponsor[];
  judges?: Judge[];
  rules?: string[];
  faqs?: FAQ[];
  organizerContact?: {
    phone: string;
    email: string;
  };
  gallery?: string[];
  isPaid?: boolean;
  registrationFee?: string;
  duration?: string;
  format?: {
    rounds: string[];
    type: 'Online' | 'Offline' | 'Hybrid';
    mode: 'Team' | 'Solo' | 'Both';
  };
  dos?: string[];
  donts?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  avatar: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  date?: string;
  createdAt?: number;
  isMe: boolean;
  audioUrl?: string;
  audioDuration?: number;
  attachment?: ChatAttachment;
  deletedForUsers?: string[];
  deletedForEveryone?: boolean;
}

export interface Team {
  id: string;
  name: string;
  hackathon: string;
  description: string;
  expectations?: string[];
  maxMembers: number;
  status: 'Open' | 'Closed';
  members: TeamMember[];
  messages: ChatMessage[];
  location?: string;
}

export interface JoinRequest {
  id: string;
  teamId: string;
  teamName?: string;
  hackathon?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}
