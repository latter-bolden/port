import React, { useEffect } from 'react';
import { HashRouter, Route, Switch, useHistory } from 'react-router-dom'
import { hot } from 'react-hot-loader';
import { Welcome } from './pages/Welcome'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from 'react-query';
import { Launch } from './ship/Launch';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorPage } from './pages/ErrorPage';
import { Ship } from './ship/Ship';
import { RemotePierDetails } from './details/pages/RemotePierDetails';
import { ExistingShipDetails } from './details/pages/ExistingShipDetails';
import { MoonDetails } from './details/pages/MoonDetails';
import { CometDetails } from './details/pages/CometDetails';
import { Boot } from './ship/Boot';
import { PlanetDetails } from './details/pages/PlanetDetails';
import { PlanetInviteDetails } from './details/pages/PlanetInviteDetails';
import { PlanetKeyDetails } from './details/pages/PlanetKeyDetails';
import { routeMap } from './routes';
import create from 'zustand';
import { pierKey } from './query-keys';
import { listen, muteHandler, send } from './client/ipc';
import { Star } from './details/pages/Star';
import { ipcRenderer } from 'electron';
import { Settings } from '../background/db';
import { Settings as SettingsPage } from './pages/Settings';
import { Pier } from '../background/services/pier-service';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
});

interface PortStore {
    piers: Pier[];
    architectureUnsupported: string;
    archCheckOpen: boolean;
    protocolLink: string;
    settings: Record<Settings, string>;
    updateStatus: string;
    zoomLevels: {
        main: number;
        views: string;
    }
}

export const useStore = create<PortStore>(() => ({
    piers: [],
    architectureUnsupported: null,
    archCheckOpen: true,
    protocolLink: null,
    settings: {
        'seen-grid-update-modal': 'true',
        'global-leap': 'true',
        'protocol-handling': 'true',
    },
    updateStatus: 'initial',
    zoomLevels: {
        main: 1,
        views: '1'
    }
}))

const AppWrapped = () => (
    <QueryClientProvider client={queryClient}>
        <HashRouter>
            <ErrorBoundary fallbackRender={ErrorPage}>
                <App />
            </ErrorBoundary>
        </HashRouter>
    </QueryClientProvider>
)

const App = () => {
    const queryClient = useQueryClient();
    useQuery('settings', () => send('get-settings'), {
        onSuccess: (settings) => {
            const newSettings = settings.reduce((map, setting) => {
                map[setting.name] = setting.value;
                return map;
            }, {}) as Record<Settings, string>;

            useStore.setState({ settings: newSettings });
        }
    })
    useQuery(pierKey(), async () => {
        const piers = await send('get-piers')
        
        for (const pier of piers) {
            await send('check-pier', pier);
        }

        return send('get-piers')
    }, {
        refetchInterval: 60 * 1000,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        onSuccess: (piers) => {
            piers.forEach(pier => {
                queryClient.invalidateQueries(pierKey(pier.slug));
            })
        }
    });

    useEffect(() => {
        muteHandler('get-piers');
        muteHandler('check-pier');
    }, [])

    useEffect(() => {
        const listener = (event, args) => {
            useStore.setState({ zoomLevels: args })
        } 

        ipcRenderer.on('zoom-levels', listener);

        return () => {
            ipcRenderer.removeListener('zoom-levels', listener)
        }
    }, [])

    const history = useHistory();
    useEffect(() => {
      const listener = (event, args) => {
        console.log(args);
        history.push(`/boot/planet/invite/${args.ticket}`);
      } 

      ipcRenderer.on('navigate', listener);
    }, [])

    useEffect(() => {
        const listeners = [
            listen('arch-unsupported', (architectureUnsupported) => {
                console.log({ architectureUnsupported })
                useStore.setState({ architectureUnsupported: architectureUnsupported as string })
            })
        ]

        return () => {
            listeners.forEach(unlisten => unlisten());
        }
    }, [])

    return (
        <Switch>                        
            <Route exact path={routeMap.remote.path} component={RemotePierDetails} />
            <Route exact path={routeMap.existing.path} component={ExistingShipDetails} />
            <Route exact path={routeMap.planet.path} component={PlanetDetails} />
            <Route path={routeMap.planetInvite.path} component={PlanetInviteDetails} />
            <Route exact path={routeMap.planetKey.path} component={PlanetKeyDetails} />
            <Route exact path={routeMap.moon.path} component={MoonDetails} />
            <Route exact path={routeMap.comet.path} component={CometDetails} />
            <Route exact path={routeMap.star.path} component={Star} />
            <Route path="/boot/new/:slug" component={Boot} />
            <Route exact path="/pier/:slug/launch" component={Launch} />
            <Route path="/pier/:slug" component={Ship} />
            <Route path="/settings" component={SettingsPage} />
            <Route exact path="/" component={Welcome} />
        </Switch>    
    );
}

export default hot(module)(AppWrapped);
