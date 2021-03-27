import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom'
import { hot } from 'react-hot-loader';
import { Welcome } from './pages/Welcome'
import { QueryClient, QueryClientProvider } from 'react-query';
import { Launch } from './ship/Launch';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorPage } from './pages/ErrorPage';
import { Ship } from './ship/Ship';
import { RemotePierDetails } from './details/RemotePierDetails';
import { ExistingShipDetails } from './details/ExistingShipDetails';
import { MoonDetails } from './details/MoonDetails';
import { CometDetails } from './details/CometDetails';
import { Boot } from './ship/Boot';
import { PlanetDetails } from './details/PlanetDetails';

const queryClient = new QueryClient();

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <HashRouter>
                <ErrorBoundary fallbackRender={ErrorPage}>
                    <Switch>                        
                        <Route exact path="/boot/remote" component={RemotePierDetails} />
                        <Route exact path="/boot/existing" component={ExistingShipDetails} />
                        <Route exact path="/boot/planet" component={PlanetDetails} />
                        <Route exact path="/boot/moon" component={MoonDetails} />
                        <Route exact path="/boot/comet" component={CometDetails} />
                        <Route path="/boot/:slug" component={Boot} />
                        <Route exact path="/pier/:slug/launch" component={Launch} />
                        <Route path="/pier/:slug" component={Ship} />
                        <Route exact path="/" component={Welcome} />
                    </Switch>
                </ErrorBoundary>
            </HashRouter>
        </QueryClientProvider>
    );
}

export default hot(module)(App);
