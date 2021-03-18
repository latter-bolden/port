import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom'
import { hot } from 'react-hot-loader';
import { Welcome } from './pages/Welcome'
import { CometIndex } from './pages/CometIndex';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Launch } from './ship/Launch';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorPage } from './pages/ErrorPage';
import { Ship } from './ship/Ship';
import { RemotePierDetails } from './ship/RemotePierDetails';
import { ExistingShipDetails } from './ship/ExistingShipDetails';

const queryClient = new QueryClient();

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <HashRouter>
                <ErrorBoundary fallbackRender={ErrorPage}>
                    <Switch>
                        <Route exact path="/pier/:slug/launch" component={Launch} />
                        <Route path="/pier/:slug" component={Ship} />
                        <Route path="/boot/remote" component={RemotePierDetails} />
                        <Route path="/boot/existing" component={ExistingShipDetails} />
                        <Route path="/boot/comet" component={CometIndex} />
                        <Route exact path="/" component={Welcome} />
                    </Switch>
                </ErrorBoundary>
            </HashRouter>
        </QueryClientProvider>
    );
}

export default hot(module)(App);
