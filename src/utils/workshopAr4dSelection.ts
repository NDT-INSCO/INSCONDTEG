import type { WorkshopAr4dBranchId } from '../data/workshopAr4dBranchesData';

let pendingAr4dBranch: WorkshopAr4dBranchId | null = null;

export function setPendingAr4dBranch(branchId: WorkshopAr4dBranchId): void {
  pendingAr4dBranch = branchId;
}

export function peekPendingAr4dBranch(): WorkshopAr4dBranchId | null {
  return pendingAr4dBranch;
}

export function consumePendingAr4dBranch(): WorkshopAr4dBranchId | null {
  const value = pendingAr4dBranch;
  pendingAr4dBranch = null;
  return value;
}
