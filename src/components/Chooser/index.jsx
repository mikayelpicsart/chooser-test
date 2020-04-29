import React, { useCallback } from 'react';
import { useHistory, Route, Switch } from 'react-router-dom';
import { addData } from '../../services/IndexedDbService';
import {
    FreeToEdit,
    Templates,
    MyProfile,
    MyCollections,
    Upload,
    Link as ChooserLink,
    Selected,
    ChooserActionProvider
} from '@PicsArtWeb/react-ui-library';

export function Chooser() {
    const history = useHistory();

    const onNextClick = useCallback(async (images) => {
        for (const image of images) {
            image.status = 'pending';

            await addData(image);
        }
        history.push('/process');
    }, [history]);

    const searchUrl = 'https://api.picsart.com/photos/search.json?q=origfte,people,person';

    return (<ChooserActionProvider onNextClick={onNextClick}>
        <Switch>
            <Route path={'/free_to_edit'}>
                <FreeToEdit searchUrl={searchUrl} />
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
            <Route exact path={'/'}>
                <Upload />
            </Route>
        </Switch>
    </ChooserActionProvider>);
}
