import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Users, Bell, Trash2, Zap, LogOut } from 'lucide-react';

export interface Notification {
  id: number;
  text: string;
  eventName: string;
  eventId: string;
  timestamp: Date;
  read: boolean;
}

interface TopBarProps {
  notifications?: Notification[];
  onNotificationClick?: (eventId: string) => void;
  onClearNotifications?: () => void;
  onMarkRead?: () => void;
  currentUser?: { name: string; email: string; role?: string } | null;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  notifications = [], 
  onNotificationClick = () => {}, 
  onClearNotifications = () => {},
  onMarkRead = () => {},
  currentUser = null,
  onLogout
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      onMarkRead();
    }
    setIsOpen(!isOpen);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="h-[58px] border-b border-[#e8ebef] bg-white px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 select-none shadow-xs">
      {/* Left: Course Selector & Download Banner */}
      <div className="flex items-center gap-3.5">
        <button className="flex items-center gap-2.5 px-3.5 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-xs">
          <img src="/nst_icon.png" alt="NST" className="w-5 h-5 object-contain" />
          <span className="text-[14.5px] font-bold text-slate-900 tracking-tight">NST'25 CS+AI RU</span>
          <ChevronDown className="w-4.5 h-4.5 text-slate-800 stroke-[2.5]" />
        </button>

        {/* Download Banner */}
        <div className="flex items-center pl-4 pr-1.5 py-1 bg-[#FFF9EC] border border-[#FDE8C3] rounded-full gap-2.5">
          <span className="text-[13px] font-semibold text-slate-900 mr-2">
            Download the latest version of exam apps.
          </span>
          <button className="bg-[#D97706] hover:bg-[#B45309] text-white text-[12.5px] font-bold px-4 py-1.5 rounded-full transition-colors shadow-xs">
            Download
          </button>
        </div>
      </div>

      {/* Right: Actions, XP, Profile */}
      <div className="flex items-center gap-3.5">
        {/* Gift Circle Button */}
        <button className="w-9 h-9 rounded-full bg-[#18181B] flex items-center justify-center hover:opacity-90 transition-opacity">
          <img src="/gift_circle.png" alt="Gift" className="w-7.5 h-7.5 rounded-full object-cover" />
        </button>

        {/* Total XP Pill */}
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-slate-200 bg-white shadow-xs">
          <span className="text-[13px] font-bold text-slate-800">Total XP</span>
          <img src="/xp_coin.png" alt="XP Coin" className="w-4.5 h-4.5 object-contain" />
          <span className="text-base font-extrabold text-slate-950 tracking-tight">9,786</span>
        </div>

        {/* Users / Peers Icon */}
        <button className="p-2 text-slate-800 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-50">
          <Users className="w-[22px] h-[22px]" />
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button 
            id="tour-notifications"
            onClick={handleToggle}
            className={`p-2 transition-colors relative rounded-lg hover:bg-slate-50 ${isOpen ? 'text-blue-600 bg-slate-50' : 'text-slate-800 hover:text-slate-950'}`}
          >
            <Bell className="w-[22px] h-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {isOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</h3>
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full text-[10px] font-bold">{notifications.length}</span>
                </div>
                {notifications.length > 0 && (
                  <button 
                    onClick={onClearNotifications}
                    className="text-[10px] font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors uppercase tracking-wider"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              
              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center">
                    <Bell className="w-5 h-5 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-500">No new notifications</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map(n => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          onNotificationClick(n.eventId);
                          setIsOpen(false);
                        }}
                        className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-2.5 ${!n.read ? 'bg-blue-50/20' : ''}`}
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Zap className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[11px] font-bold text-slate-800 truncate">{n.eventName}</span>
                            <span className="text-[9px] text-slate-400 shrink-0">{formatTime(n.timestamp)}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{n.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="w-9 h-9 rounded-full overflow-hidden border border-slate-300 shrink-0 cursor-pointer hover:opacity-90 transition-opacity block"
            title={currentUser ? `${currentUser.name} (${currentUser.email})` : 'Account'}
          >
            <img src="/avatar.png" alt="Profile" className="w-full h-full object-cover" />
          </button>

          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              {currentUser && (
                <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                  {currentUser.role && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      {currentUser.role}
                    </span>
                  )}
                </div>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
