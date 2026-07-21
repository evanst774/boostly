// src/lib/env/index.ts
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
}

export function getEnvironment(): 'production' | 'development' | 'test' {
    return process.env.NODE_ENV as 'production' | 'development' | 'test' || 'development';
}