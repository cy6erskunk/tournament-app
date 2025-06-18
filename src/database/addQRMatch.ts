"use server";

import { Result } from "@/types/result";
import { db } from "./database";

interface QRMatchPending {
  match_id: string;
  tournament_id: number;
  player1: string;
  player2: string;
  round: number;
  match: number;
  created_at: Date;
}

export async function addQRMatch(
  qrMatch: Omit<QRMatchPending, "created_at">
): Promise<Result<QRMatchPending, string>> {
  try {
    // For now, we'll use a simple JSON storage approach
    // In production, you'd want to add a qr_matches table to the database
    
    const matchData = {
      ...qrMatch,
      created_at: new Date(),
    };
    
    // Store in global Map for demo purposes
    global.qrMatchStorage = global.qrMatchStorage || new Map();
    global.qrMatchStorage.set(qrMatch.match_id, matchData);
    
    return { success: true, value: matchData };
  } catch (error) {
    console.error('Error storing QR match:', error);
    return { success: false, error: "Could not store QR match" };
  }
}

export async function getQRMatch(matchId: string): Promise<Result<QRMatchPending, string>> {
  try {
    global.qrMatchStorage = global.qrMatchStorage || new Map();
    const matchData = global.qrMatchStorage.get(matchId);
    
    if (!matchData) {
      console.warn(`QR match not found for ID: ${matchId}, existing matches: ${Array.from(global.qrMatchStorage.keys()).join(', ')}`);
      return { success: false, error: "QR match not found" };
    }
    
    // Check if match is expired (1 hour)
    const now = new Date();
    const createdAt = new Date(matchData.created_at);
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 1) {
      global.qrMatchStorage.delete(matchId);
      return { success: false, error: "QR match expired" };
    }
    
    return { success: true, value: matchData };
  } catch (error) {
    console.error('Error retrieving QR match:', error);
    return { success: false, error: "Could not retrieve QR match" };
  }
}

export async function removeQRMatch(matchId: string): Promise<void> {
  try {
    global.qrMatchStorage = global.qrMatchStorage || new Map();
    global.qrMatchStorage.delete(matchId);
  } catch (error) {
    console.error('Error removing QR match:', error);
  }
}