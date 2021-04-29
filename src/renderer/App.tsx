import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom'
import { hot } from 'react-hot-loader';
import { Welcome } from './pages/Welcome'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
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
import { routeMap } from './routes';
import create from 'zustand';
import { pierKey } from './query-keys';
import { send } from './client/ipc';
import { Star } from './details/pages/Star';

const queryClient = new QueryClient();

export const useStore = create(() => ({
    piers: []
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
    useQuery(pierKey(), async () => {
        const piers = await send('get-piers')
        
        for (const pier of piers) {
            await send('check-pier', pier);
        }

        return send('get-piers')
    }, {
        refetchInterval: 60 * 1000,
        refetchIntervalInBackground: true
    });

    return (
        <Switch>                        
            <Route exact path={routeMap.remote.path} component={RemotePierDetails} />
            <Route exact path={routeMap.existing.path} component={ExistingShipDetails} />
            <Route exact path={routeMap.planet.path} component={PlanetDetails} />
            <Route exact path={routeMap.moon.path} component={MoonDetails} />
            <Route exact path={routeMap.comet.path} component={CometDetails} />
            <Route exact path={routeMap.star.path} component={Star} />
            <Route path="/boot/new/:slug" component={Boot} />
            <Route exact path="/pier/:slug/launch" component={Launch} />
            <Route path="/pier/:slug" component={Ship} />
            <Route exact path="/" component={Welcome} />
        </Switch>    
    );
}

export default hot(module)(AppWrapped);
