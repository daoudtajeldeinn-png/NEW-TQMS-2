
import { AuditTrailEntry, User } from '../types';

const STORAGE_KEY = 'pharma_master_audit_trail_v6';

export const logAuditAction = (
  user: User, 
  action: string, 
  module: string, 
  details: string,
  meta?: { previousValue?: any; newValue?: any; reason?: string; recordId?: string }
) => {
  const existing = localStorage.getItem(STORAGE_KEY);
  const trail: AuditTrailEntry[] = existing ? JSON.parse(existing) : [];
  
  const newEntry: AuditTrailEntry = {
    id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(), // Standard ISO format for international compliance
    user: user.username,
    action,
    module,
    details,
    recordId: meta?.recordId,
    previousValue: meta?.previousValue ? JSON.stringify(meta.previousValue) : undefined,
    newValue: meta?.newValue ? JSON.stringify(meta.newValue) : undefined,
    reasonForChange: meta?.reason
  };

  const updated = [newEntry, ...trail].slice(0, 5000); // Expanded ledger capacity
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getAuditTrail = (): AuditTrailEntry[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const getAuditByRecordId = (recordId: string): AuditTrailEntry[] => {
  const trail = getAuditTrail();
  return trail.filter(entry => entry.recordId === recordId);
};
