import React from 'react';
import { HashRouter, Route, Switch } from 'react-router-dom'
import { hot } from 'react-hot-loader';
import { Welcome } from './pages/Welcome'
import { CometIndex } from './pages/CometIndex';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Launch } from './pier/Launch';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorPage } from './pages/ErrorPage';

const queryClient = new QueryClient();

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <HashRouter>
                <ErrorBoundary fallbackRender={ErrorPage}>
                    <Switch>
                        <Route path="/pier/launch/:slug" component={Launch} />
                        <Route path="/boot/comet" component={CometIndex}/>
                        <Route exact path="/" component={Welcome}/>
                    </Switch>
                </ErrorBoundary>
            </HashRouter>
        </QueryClientProvider>
    );
}

export default hot(module)(App);
