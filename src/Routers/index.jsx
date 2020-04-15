import React from 'react';
import { Route, Switch, NavLink } from 'react-router-dom';
import { Sidebar, FreeToEdit, Templates, MyProfile, MyCollections, Link as ChooserLink } from '@PicsArtWeb/react-ui-library';

// type IChooserSidebarType = 'free_to_edit' | 'my_profile' | 'my_collections' | 'link';

const sidebarMenu = [{
    link: '/free_to_edit',
    name: 'Free to Edit',
    componentName: 'FreeToEdit',
    type: 'free_to_edit',
}, {
    link: '/templates',
    name: 'Templates',
    componentName: 'Templates'
}, {
    link: '/my_profile',
    name: 'My Profile',
    componentName: 'FreeToEdit',
    type: 'my_profile',

}, {
    link: '/my_collections',
    name: 'My Collections',
    componentName: 'FreeToEdit',
    type: 'my_collections',

}, {
    link: '/link',
    name: 'Link (URL)',
    componentName: 'FreeToEdit',
    type: 'link',

}];

export function Routers({children}) {
    console.log('Router');
    return (
        <section className='chooser'>
            <Sidebar>
                {sidebarMenu.map(({link, name}) => <NavLink activeClassName='active' key={link} to={link}>{name}</NavLink>)}

                <div onClick={() => console.log('selected')}>Selected</div>
            </Sidebar>
            <Switch>
                <Route path={'/free_to_edit'}>
                    <FreeToEdit/>
                </Route>
                <Route path={'/my_profile'}>
                    <MyProfile/>
                </Route>
                <Route path={'/my_collections'}>
                    <MyCollections/>
                </Route>
                <Route path={'/link'}>
                    <ChooserLink/>
                </Route>
                <Route path={'/templates'}>
                    <Templates/>
                </Route>
            </Switch>
        </section>
    );
}
