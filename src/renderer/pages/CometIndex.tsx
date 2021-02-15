import React, { FunctionComponent } from 'react'
import { Redirect, Route, RouteComponentProps, Switch } from 'react-router-dom'
import { CometBoot } from '../comet/CometBoot'
import { CometDetails } from '../comet/CometDetails'

export const CometIndex: FunctionComponent<RouteComponentProps> = ({ location }) => {
    if (location.pathname === '/boot/comet') {
        return <Redirect to="/boot/comet/new" />
    }

    return (
        <Switch>
            <Route exact path="/boot/comet/new" component={CometDetails} />
            <Route exact path="/boot/comet/:slug" component={CometBoot} />
        </Switch>
    )
}