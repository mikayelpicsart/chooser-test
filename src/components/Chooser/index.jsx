import React, { useEffect, useCallback, useContext } from 'react';
import { useHistory, Route, useRouteMatch } from 'react-router-dom';
import { addData } from '../../services/IndexedDbService';
import {
    FreeToEdit,
    Templates,
    MyProfile,
    MyCollections,
    Upload,
    Link as ChooserLink,
    Selected,
    ChooserActionProvider,
    ChooserContext
} from '@PicsArtWeb/react-ui-library';

function RouteCustom({ path, children }) {
    const match = useRouteMatch(path);
    return React.cloneElement(children, { hidden: !match });
}

export function Chooser() {
    const [{ images = [] } = {}] = useContext(ChooserContext);
    const history = useHistory();

    useEffect(() => {
        if (!images.length) {
            history.push('/');
        }
    }, [images.length, history]);

    const onNextClick = useCallback(async (images) => {
        for (const image of images) {
            image.status = 'pending';

            await addData(image);
        }

        history.push('/process');
    }, [history]);

    const searchUrl = 'https://api.picsart.com/photos/search.json?q=origfte,people,person';

    return (<ChooserActionProvider onNextClick={onNextClick}>
        <RouteCustom path={'/free_to_edit'}>
            <FreeToEdit searchUrl={searchUrl}/>
        </RouteCustom>
        <Route path={'/templates'}>
            <Templates onTemplateClick={(test) => console.log(test)} />
        </Route>
        <RouteCustom path={'/my_profile'}>
            <MyProfile userId={98050114} />
        </RouteCustom>
        <RouteCustom path={'/my_collections'}>
            <MyCollections userId={98050114} />
        </RouteCustom>

        <Route path={'/link'}>
            <ChooserLink />
        </Route>
        <Route path={'/selected'}>
            <Selected />
        </Route>
        <Route exact path={'/'}>
            <Upload />
        </Route>
    </ChooserActionProvider>);
}
