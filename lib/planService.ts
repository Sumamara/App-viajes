import { supabase } from './supabase';

const TABLE = 'AppViajes';

/**
 * Saves the itinerary data to Supabase.
 * If customId is provided, uses it as the plan ID (upserts if exists).
 * Returns the final plan ID.
 */
export async function savePlan(data: object, customId?: string): Promise<string> {
    const payload: any = { data };
    if (customId) payload.id = customId.toLowerCase().trim().replace(/\s+/g, '-');

    const { data: result, error } = await supabase
        .from(TABLE)
        .upsert(payload)
        .select('id')
        .single();

    if (error) throw new Error(error.message);
    return result.id;
}

/**
 * Loads the itinerary data from Supabase using the plan ID.
 */
export async function loadPlan(id: string): Promise<any> {
    const { data: result, error } = await supabase
        .from(TABLE)
        .select('data')
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return result.data;
}

/**
 * Checks if a plan ID already exists in Supabase.
 */
export async function checkPlanExists(id: string): Promise<boolean> {
    const { data, error } = await supabase
        .from(TABLE)
        .select('id')
        .eq('id', id)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return !!data;
}
