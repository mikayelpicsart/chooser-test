import React, {useContext} from 'react';
import {Route, Switch, NavLink, useHistory} from 'react-router-dom';
import {
    Sidebar,
    FreeToEdit,
    Templates,
    MyProfile,
    MyCollections,
    Link as ChooserLink,
    Upload,
    Selected,
    ChooserContext,
} from '@PicsArtWeb/react-ui-library';
import {useCallback} from 'react';

// type IChooserSidebarType = 'free_to_edit' | 'my_profile' | 'my_collections' | 'link';

const sidebarMenu = [{
    link: '/free_to_edit',
    name: 'Free to Edit',
    type: 'free_to_edit',
}, {
    link: '/templates',
    name: 'Templates',
    type: 'templates',
}, {
    link: '/my_profile',
    name: 'My Profile',
    type: 'my_profile',

}, {
    link: '/my_collections',
    name: 'My Collections',
    type: 'my_collections',

}, {
    link: '/link',
    name: 'Link (URL)',
    type: 'link',

}];

const SelectedItem = () => {
    const chooserContext = useContext(ChooserContext);
    if (chooserContext === null) {
        console.error('component FreeToEdit must be wrapped in ChooserProvider');
    }
    const history = useHistory();
    const handlerClick = useCallback(() => {
        history.push('/selected')
    }, [history]);

    const [{ images = [] } = {}] = chooserContext;


    return (
        <div onClick={handlerClick}>
            <span>Selected</span>
            <span>({images.length})</span>
        </div>
    )
};

export function Routers({children}) {
    const history = useHistory();
    const handlerUpload = useCallback(() => {
        history.push('/')
    }, [history]);
    return (
        <section className='chooser'>
            <Sidebar onUpload={handlerUpload}>
                {sidebarMenu.map(({link, name}) => <NavLink activeClassName='active' key={link} to={link}>{name}</NavLink>)}

                <SelectedItem/>

            </Sidebar>
            <Switch>
                <Route path={'/free_to_edit'}>
                    <FreeToEdit/>
                </Route>
                <Route path={'/templates'}>
                    <Templates/>
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
                <Route path={'/selected'}>
                    <Selected/>
                </Route>
                <Route path={'/'}>
                    <Upload/>
                </Route>
            </Switch>
        </section>
    );
}
