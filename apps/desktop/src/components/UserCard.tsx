/**
 * MY-DOGE-MACRO UserCard Component
 * Display user information with status indicator
 * Version: v2.0.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { cn } from '../lib/utils';

export interface UserCardProps {
  /** User ID */
  id: string;
  /** User display name */
  name: string;
  /** User email */
  email?: string;
  /** User avatar URL */
  avatar?: string;
  /** Is user online */
  isOnline?: boolean;
  /** Is user verified */
  isVerified?: boolean;
  /** Custom class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  id,
  name,
  email,
  avatar,
  isOnline = true,
  isVerified = false,
  className,
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        y: -5, 
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden w-full p-4",
        "bg-white dark:bg-[#1a1d20]",
        "border border-[var(--border-primary)] rounded-2xl",
        "shadow-sm dark:shadow-none",
        "flex items-center gap-4",
        "transition-all duration-300",
        onClick && "cursor-pointer hover:border-[var(--accent-primary)]",
        className
      )}
    >
      {/* Status Indicator */}
      <div className="relative">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center",
          "bg-[var(--bg-secondary)] border border-[var(--border-primary)]",
          "shadow-inner overflow-hidden"
        )}>
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <User size={24} strokeWidth={1.2} className="text-[var(--text-secondary)]" />
          )}
        </div>
        
        {/* Online Status */}
        <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center">
          <div className={cn(
            "w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-primary)]",
            isOnline ? "bg-[var(--status-success)]" : "bg-[var(--text-secondary)]"
          )} />
        </div>
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
            {name}
          </h3>
          {isVerified && (
            <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        {email && (
          <p className="text-xs text-[var(--text-secondary)] truncate">
            {email}
          </p>
        )}
      </div>

      {/* ID Badge */}
      <span className="text-[10px] text-[var(--text-secondary)] font-mono opacity-60">
        #{id.substring(0, 8)}
      </span>
    </motion.div>
  );
};

UserCard.displayName = 'UserCard';

export { UserCard };