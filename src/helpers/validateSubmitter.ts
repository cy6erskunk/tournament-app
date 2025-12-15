import { db } from "@/database/database";

export type ValidationResult =
    | { success: true; submitterToken: string | null }
    | { success: false; error: string; status: number };

export async function validateSubmitter(
    deviceToken: string | undefined,
    required: boolean
): Promise<ValidationResult> {
    // If no token is provided and it's required, fail immediately
    if (!deviceToken && required) {
        return { success: false, error: "Device registration required for this tournament", status: 401 };
    }

    // If we have a token (either required or optional), verify it
    if (deviceToken) {
        const device = await db
            .selectFrom('submitter_devices')
            .select(['device_token'])
            .where('device_token', '=', deviceToken)
            .executeTakeFirst();

        if (device) {
            await db
                .updateTable('submitter_devices')
                .set({ last_used: new Date() })
                .where('device_token', '=', deviceToken)
                .execute();

            return { success: true, submitterToken: deviceToken };
        }

        // If token was provided but not found:
        // If required -> Error
        // If not required -> It's just an invalid optional token, ignore it (return null token)
        if (required) {
            return { success: false, error: "Invalid device token", status: 401 };
        }
    }

    // Fallback: No token provided (and not required), or invalid optional token
    return { success: true, submitterToken: null };
}
