import React, { useCallback } from 'react';
import { useHistory, Route, Switch } from 'react-router-dom';
import { addData } from '../../services/IndexedDbService';
import {
    FreeToEdit,
    Templates,
    Sutterstock,
    MyProfile,
    MyCollections,
    Upload,
    Link as ChooserLink,
    Selected,
    ChooserActionProvider,
} from '@PicsArtWeb/react-ui-library';

// function RouteCustom({ path, children }) {
//     const match = useRouteMatch(path);
//     return React.cloneElement(children, { hidden: !match });
// }

export function Chooser() {
    // const [{ images = [] } = {}] = useContext(ChooserContext);
    const history = useHistory();

    // useEffect(() => {
    //     if (!images.length) {
    //         history.push('/');
    //     }
    // }, [images.length, history]);

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
                <FreeToEdit searchUrl={searchUrl}/>
            </Route>
            <Route path={'/templates'}>
                <Templates onTemplateClick={(test) => console.log(test)}/>
            </Route>
            <Route path={'/sutterstock'}>
                <Sutterstock/>
            </Route>
            <Route path={'/my_profile'}>
                <MyProfile userId={98050114}/>
            </Route>
            <Route path={'/my_collections'}>
                <MyCollections userId={98050114}/>
            </Route>

            <Route path={'/link'}>
                <ChooserLink/>
            </Route>
            <Route path={'/selected'}>
                <Selected/>
            </Route>
            <Route exact path={'/'}>
                <Upload/>
            </Route>
        </Switch>
    </ChooserActionProvider>);
}
