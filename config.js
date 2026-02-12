// centralized configuration for Supabase, Fonnte, Workers, and business settings

const config = {
    supabase: {
        url: 'YOUR_SUPABASE_URL',
        key: 'YOUR_SUPABASE_KEY'
    },
    fontte: {
        apiKey: 'YOUR_FONTTE_API_KEY'
    },
    workers: {
        workerId: 'YOUR_WORKER_ID'
    },
    business: {
        setting1: 'YOUR_SETTING_VALUE',
        setting2: 'YOUR_SETTING_VALUE'
    }
};

module.exports = config;