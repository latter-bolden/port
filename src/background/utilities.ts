import { readdirSync } from 'fs'
import path from 'path'

export const dirs = (incomingPath: string): string[] => {
    return readdirSync(incomingPath, { withFileTypes: true })
        .filter(item => item.isDirectory())
        .map(dir => path.join(incomingPath, dir.name))
}