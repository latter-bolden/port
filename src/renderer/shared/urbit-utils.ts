export function getCometShortName(comet: string) {
    const parts = comet.split('-');

    if (!parts.length)
        return null;

    const first = parts[0];
    const last = parts[parts.length - 1]

    return `${first}_${last}`
}