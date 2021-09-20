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

const devship: RouteInfo = {
    key: 'devship',
    path: '/boot/devship',
    title: 'Development ship',
    heading: 'Boot a development ship',
    description: 'Start a development ship with local networking'
}

const planet: RouteInfo = {
    key: 'planet',
    path: '/boot/planet',
    title: 'Planet',
    heading: 'Boot a fresh ID',
    description: 'Boot your planet with the keyfile from Bridge'
}

const star: RouteInfo = {
    key: 'star',
    path: '/boot/star',
    title: 'Star',
    heading: 'Boot a star',
    description: 'Boot your star, not recommended for sponsorship'
}

const moon: RouteInfo = {
    key: 'moon',
    path: '/boot/moon',
    title: 'Moon',
    heading: 'Boot a child ID',
    description: 'Boot a moon with the keyfile from running <pre class="inline">|moon</pre> in dojo'
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
    star,
    comet,
    devship,
    planet,
    moon,
    existing,
    remote
}

export const routes: RouteInfo[] = [
    star,
    planet,
    moon,
    comet,
    devship,
    existing,
    remote
]
