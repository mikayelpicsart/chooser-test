import React, { memo, useContext, useCallback, useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';
import { ChooserProvider } from '@PicsArtWeb/react-ui-library';
import { Sidebar } from '../components/Sidebar';
import { Chooser } from '../components/Chooser';

export function Routers() {
    return (
        <section className='chooser'>
            <ChooserProvider>
                <Sidebar />
                <Chooser />
                <Switch>
                    <Route path='/process' >
                        <div>process</div>
                    </Route>
                </Switch>
            </ChooserProvider>
        </section>
    );
}
