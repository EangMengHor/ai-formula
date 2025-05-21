import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	console.error('Supabase URL or Anon Key not found in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getUserFiles(userId) {
	try {
		if (!userId) {
			throw new Error('userId is required');
		}

		const { data: files, error } = await supabase
			.from('personalknowledgefiles')
			.select('*')
			.eq('userid', userId)
			.order('createdat', { ascending: false });

		if (error) {
			throw error;
		}

		return files;
	} catch (error) {
		console.error('Error getting user files:', error);
		return null;
	}
}

export default {
	getUserFiles,
};
