export function pierKey(slug?: string): string[] {
    const key = 'piers';
    return slug ? [key, slug] : [key]
}