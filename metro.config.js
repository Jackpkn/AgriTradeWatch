const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add path aliases
config.resolver.alias = {
    '@': path.resolve(__dirname, './'),
    '@/components': path.resolve(__dirname, './components'),
    '@/hooks': path.resolve(__dirname, './hooks'),
    '@/utils': path.resolve(__dirname, './utils'),
    '@/constants': path.resolve(__dirname, './constants'),
    '@/types': path.resolve(__dirname, './types'),
    '@/config': path.resolve(__dirname, './config'),
    '@/context': path.resolve(__dirname, './context'),
    '@/services': path.resolve(__dirname, './services'),
    '@/assets': path.resolve(__dirname, './assets'),
};

module.exports = config;