import React, { Suspense } from 'react';
import { BrowserRouter as RouterProvider } from 'react-router-dom';
import ReactDOM from 'react-dom';
import { ChooserProvider } from '@PicsArtWeb/react-ui-library';
import './index.css';
import * as serviceWorker from './serviceWorker';
import '@PicsArtWeb/react-ui-library/dist/index.css';
import { Routers } from './Routers';

ReactDOM.render(
  
    <Suspense fallback={<div>Loading...</div>} >
      <ChooserProvider>
        <RouterProvider>
          <Routers />
        </RouterProvider>
      </ChooserProvider>
    </Suspense>
  ,
  document.getElementById('root')
);



// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
