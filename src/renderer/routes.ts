export type RouteInfo = {
    key: string;
    path: string;
    title: string;
    heading: string;
    description: string;
}

const comet: RouteInfo = {
    key: 'comet',
    path: '/boot/comet',
    title: 'Comet',
    heading: 'Start without an ID',
    description: 'Generate a disposable identity and boot as a comet'
}

const planet: RouteInfo = {
    key: 'planet',
    path: '/boot/planet',
    title: 'Planet',
    heading: 'Boot a fresh ID',
    description: 'Boot your planet with the keyfile from Bridge'
}

const moon: RouteInfo = {
    key: 'moon',
    path: '/boot/moon',
    title: 'Moon',
    heading: 'Boot a child ID',
    description: 'Boot a moon with the keyfile from running <pre className="inline">|moon</pre> in dojo'
}

const existing: RouteInfo = {
    key: 'existing',
    path: '/boot/existing',
    title: 'Existing Ship',
    heading: 'Boot an existing ship',
    description: 'Boot your ship using the pier you\'ve already created'
}

const remote: RouteInfo = {
    key: 'remote',
    path: '/boot/remote',
    title: 'Remote Ship',
    heading: 'Access remote ship',
    description: 'Access your remote ship by URL'
}


export const routeMap = {
    comet,
    planet,
    moon,
    existing,
    remote
}

export const routes: RouteInfo[] = [
    planet,
    moon,
    comet,
    existing,
    remote
]