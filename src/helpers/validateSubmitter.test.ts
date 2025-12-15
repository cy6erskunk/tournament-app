import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSubmitter } from './validateSubmitter';
import { db } from '@/database/database';

// Mock the database
vi.mock('@/database/database', () => ({
    db: {
        selectFrom: vi.fn(),
        updateTable: vi.fn(),
    },
}));

describe('validateSubmitter', () => {
    const mockSelectFrom = db.selectFrom as any;
    const mockUpdateTable = db.updateTable as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when validation is required', () => {
        it('should fail if deviceToken is missing', async () => {
            const result = await validateSubmitter(undefined, true);
            expect(result).toEqual({
                success: false,
                error: "Device registration required for this tournament",
                status: 401
            });
        });

        it('should fail if deviceToken is invalid', async () => {
            // Mock db chain for selectFrom
            const mockSelect = {
                select: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                executeTakeFirst: vi.fn().mockResolvedValue(undefined),
            };
            mockSelectFrom.mockReturnValue(mockSelect);

            const result = await validateSubmitter('invalid-token', true);

            expect(result).toEqual({
                success: false,
                error: "Invalid device token",
                status: 401
            });
            expect(mockSelectFrom).toHaveBeenCalledWith('submitter_devices');
        });

        it('should succeed and return token if valid', async () => {
            // Mock db chain for selectFrom
            const mockSelect = {
                select: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                executeTakeFirst: vi.fn().mockResolvedValue({ device_token: 'valid-token' }),
            };
            mockSelectFrom.mockReturnValue(mockSelect);

            // Mock db chain for updateTable
            const mockUpdate = {
                set: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                execute: vi.fn().mockResolvedValue(undefined),
            };
            mockUpdateTable.mockReturnValue(mockUpdate);

            const result = await validateSubmitter('valid-token', true);

            expect(result).toEqual({
                success: true,
                submitterToken: 'valid-token'
            });
            expect(mockUpdateTable).toHaveBeenCalledWith('submitter_devices');
        });
    });

    describe('when validation is NOT required', () => {
        it('should succeed with null token if deviceToken is missing', async () => {
            const result = await validateSubmitter(undefined, false);
            expect(result).toEqual({
                success: true,
                submitterToken: null
            });
        });

        it('should succeed with null token if deviceToken is provided but invalid', async () => {
            // Mock db to find nothing
            const mockSelect = {
                select: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                executeTakeFirst: vi.fn().mockResolvedValue(undefined),
            };
            mockSelectFrom.mockReturnValue(mockSelect);

            const result = await validateSubmitter('invalid-token', false);

            expect(result).toEqual({
                success: true,
                submitterToken: null
            });
        });

        it('should succeed and return token if deviceToken is provided and valid', async () => {
            // Mock db to find device
            const mockSelect = {
                select: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                executeTakeFirst: vi.fn().mockResolvedValue({ device_token: 'valid-token' }),
            };
            mockSelectFrom.mockReturnValue(mockSelect);

            // Mock db chain for updateTable
            const mockUpdate = {
                set: vi.fn().mockReturnThis(),
                where: vi.fn().mockReturnThis(),
                execute: vi.fn().mockResolvedValue(undefined),
            };
            mockUpdateTable.mockReturnValue(mockUpdate);

            const result = await validateSubmitter('valid-token', false);

            expect(result).toEqual({
                success: true,
                submitterToken: 'valid-token'
            });
            expect(mockUpdateTable).toHaveBeenCalledWith('submitter_devices');
        });
    });
});
