import React from 'react';
import { Route, Switch, Link } from 'react-router-dom';
import { Sidebar, FreeToEdit } from '@PicsArtWeb/react-ui-library';

const array = [{
    link: '/free-to-edit',
    text: 'Free To Edit'
}, {

    link: '/my-profile',
    text: 'My Profile'
}];

export function Routers({ children }) {
    return (
        <section className='chooser'>
            <Sidebar >
                {array.map(({ link, text }) => <Link key={link} to={link} >{text}</Link>)}
            </Sidebar>
            <Switch>
                <Route path={'/free-to-edit'}>
                    <FreeToEdit />
                </Route>
                <Route path={'/my-profile'}>
                    <div> Profile </div>
                </Route>
            </Switch>
        </section>
    );
}