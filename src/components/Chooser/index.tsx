import React, { useEffect, useCallback, useContext } from 'react';
import { Route, useHistory } from 'react-router-dom';
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
    }, [images]);

    return (<ChooserActionProvider onNextClick={onNextClick}>
        <Route path={'/free_to_edit'}>
            <FreeToEdit />
        </Route>
        <Route path={'/templates'}>
            <Templates onTemplateClick={(test) => console.log(test)} />
        </Route>
        <Route path={'/my_profile'}>
            <MyProfile userId={98050114} />
        </Route>
        <Route path={'/my_collections'}>
            <MyCollections userId={98050114} />
        </Route>
        <Route path={'/link'}>
            <ChooserLink />
        </Route>
        <Route path={'/selected'}>
            <Selected />
        </Route>
        <Route path={'/'}>
            <Upload />
        </Route>
    </ChooserActionProvider>);
}