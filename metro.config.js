const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for @supabase/supabase-js + Expo Metro compatibility
// Enables proper resolution of package.json "exports" field
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
