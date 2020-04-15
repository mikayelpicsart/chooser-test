import React from 'react';
import { Route, Switch, Link } from 'react-router-dom';
import { Sidebar, FreeToEdit } from '@PicsArtWeb/react-ui-library';

//type IChooserSidebarType = 'free_to_edit' | 'my_profile' | 'my_collections' | 'link';

const sidebarMenu = [{
        link: '/free_to_edit',
        name: 'Free to Edit',
        componentName: 'FreeToEdit'
    }, {
        link: '/my_profile',
        name: 'My Profile',
        componentName: 'FreeToEdit'
    }, {
        link: '/my_collections',
        name: 'My Collections',
        componentName: 'FreeToEdit'
    }, {
        link: '/link',
        name: 'Link (URL)',
        componentName: 'FreeToEdit'
    }
];

export function Routers({ children }) {
    return (
        <section className='chooser'>
            <Sidebar >
                {sidebarMenu.map(({ link, name }) => <Link key={link} to={link} >{name}</Link>)}

                <div onClick={() => console.log('selected')}>Selected</div>
            </Sidebar>
            <Switch>
                <Route path={'/free_to_edit'}>
                    <FreeToEdit />
                </Route>
                <Route path={'/my_profile'}>
                    <div> Profile </div>
                </Route>
            </Switch>
        </section>
    );
}
