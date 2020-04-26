import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { ChooserProvider } from '@PicsArtWeb/react-ui-library';
import { Sidebar } from '../components/Sidebar';
import { Chooser } from '../components/Chooser';
import Processed from '../components/Process';

export function Routers() {
    return (
        <section className='chooser'>
            <ChooserProvider>
                <Sidebar />
                <Switch>
                    <Route path='/process'>
                        <Processed/>
                    </Route>
                    <Chooser />
                </Switch>
            </ChooserProvider>
        </section>
    );
}
