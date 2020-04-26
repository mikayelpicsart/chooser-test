import React, {memo, useContext, useCallback, } from 'react';
import { NavLink, useHistory, useRouteMatch } from 'react-router-dom';
import classNames from 'classnames';
import {
    Sidebar as SidebarComponent,
    ChooserContext,
} from '@PicsArtWeb/react-ui-library';

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

const SelectedItem = memo(function SelectedItem() {
    const chooserContext = useContext(ChooserContext);
    const history = useHistory();
    if (chooserContext === null) {
        console.error('component FreeToEdit must be wrapped in ChooserProvider');
    }

    const [{ images = [] } = {}] = chooserContext;

    const match = useRouteMatch('/selected');

    const handlerClick = useCallback(() => {
        if (!images.length) {
            return;
        }

        history.push('/selected');
    }, [history, images.length]);

    return (
        <div
            onClick={handlerClick}
            className={classNames('chooser-current-sidebar-category selected-category', {
                'active-selected': match
            })}>
            <span>Selected</span>
            <span>({images.length})</span>
        </div>
    )
});

export function Sidebar() {

    const history = useHistory();

    const handlerUpload = useCallback(() => {
        history.push('/')
    }, [history]);

    return (<SidebarComponent onUpload={handlerUpload}>
        {sidebarMenu.map(({ link, name }) => <NavLink activeClassName='active' key={link} to={link}>{name}</NavLink>)}
        <SelectedItem />
    </SidebarComponent>);
}
