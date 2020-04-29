import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import Masonry from 'react-masonry-css';
import toolChain from 'toolchain';
import { createUseStyles } from 'react-jss';
import classNames from 'classnames';
import { Toolbar, ImageItem } from '@PicsArtWeb/react-ui-library';
import { getByKey, getAll, removeByKey } from '../../services/IndexedDbService';

const JSZip = require('jszip');
const FileSaver = require('file-saver');

const mimeTypesToFormat = {
    'image/jpeg': 'jpeg',
    'image/png': 'png'
};

const BREAKPOINT_COLUMNS = {
    default: 6,
    1920: 5,
    1200: 4,
    992: 3,
    700: 2,
    500: 1,
};

function ImgNoMemo({ blob, url, status, ...rest }) {

    return<div>
        {(['pending', 'error'].includes(status)) &&
        <div>
            <span>{status === 'pending' ? 'Processing' : 'Error'}</span>

            <ImageItem
                {...rest}
                url={status === 'done' ? URL.createObjectURL(blob) : url}
            />
        </div>
        }
    </div>
}

const Img = memo(ImgNoMemo);

const Processed = () => {
    const classes = useStyles();

    const [data, setData] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const doneData = useMemo(() => data.filter(item => item.status === 'done'), [data]);

    const handlerReady = useCallback(async (key) => {
        const current = await getByKey(key) || {};
        setData((prvData) => [...prvData.map(item => item.key === key ? ({ ...current }) : item)]);
    }, []);

    useEffect(() => {

        let unsubscribe = null;

        (async () => {
            const allData = await getAll() || [];
            const newData = allData.map(({ blob, ...rest }) => rest);
            unsubscribe = toolChain(newData.filter(el => el.status === 'pending').map(el => el.key), handlerReady);
            setData(newData);
        })();

        return unsubscribe ? unsubscribe : () => undefined;
    }, [handlerReady]);

    const handlerBeforeunload = useCallback((e) => {
        e = e || window.event;
        // For IE and Firefox prior to version 4
        if (e) {
            e.returnValue = 'Changes you made may not be saved.';
        }
        // For Safari
        return 'Changes you made may not be saved.';
    }, []);

    useEffect(() => {
        const ifHasPending = data.some(item => item.status === 'pending');

        if (ifHasPending) {
            window.addEventListener('beforeunload', handlerBeforeunload, false);
        }
        return () => {
            if (ifHasPending) {
                window.removeEventListener('beforeunload', handlerBeforeunload, false);
            }
        };
    }, [data, handlerBeforeunload]);

    const addSelectedImage = useCallback((key, url) => {
        setSelectedImages((prevSelectedImages) => {
            const index = prevSelectedImages.findIndex((img) => img.key === key);

            if (~index) {
                const newArray = prevSelectedImages.splice(index, 1);

                return [...newArray];
            }
            return [...prevSelectedImages, { key }];
        });
    }, []);

    const downloadImagesToZip = useCallback(() => {

        const zip = new JSZip();
        const img = zip.folder('PicsArt Bulk Images');

        Promise.all((selectedImages.length ? selectedImages : data).map(el => {
            return getByKey(el.key);
        })).then((result) => {

            result.forEach((el, index) => {
                if (!el) {
                    return;
                }

                img.file(`image${index}.${mimeTypesToFormat[el.blob.type]}`, el.blob);
            });

        }).then(() => {
            return zip.generateAsync({ type: 'blob' });
        }).then((content) => {
            FileSaver.saveAs(content, 'PicsArtBulk.zip');
        }).then(() => {
            const newData = data.filter(el => !selectedImages.map(elem => elem.key).includes(el.key));
            setData(newData);
            setSelectedImages([]);

            if (!selectedImages.length) {
                setData([]);
            }

            return (selectedImages.length ? selectedImages : data).forEach(async el => {
                await removeByKey(el.key);
            });
        });

    }, [selectedImages, data]);

    const selectAllImages = useCallback(() => {
        if (doneData.length === selectedImages.length) {
            setSelectedImages([]);

            return;
        }

        setSelectedImages(doneData);
    }, [doneData, selectedImages.length]);

    const deleteSelectedImages = useCallback(async ({type}) => {
        if (await window.customModal.confirm('Do you still want to remove images?')) {
            selectedImages.forEach(el => {
                removeByKey(el.key);
            });

            const newData = data.filter(el => !selectedImages.map(elem => elem.key).includes(el.key));
            setData(newData);
            setSelectedImages([]);
        }

    }, [selectedImages, data]);

    const handlePreviewShow = useCallback(async (key, e) => {
        e.stopPropagation();
        //
        // const current = await IndexedDBService.loadDataByKey(key) || {};
        //
        // setShowPreviewModal(true);
        // setImageDataUrl(URL.createObjectURL(current.blob));

    }, []);

    useMemo(() => {
        data.sort((a, b) => +b.key - +a.key);
    }, [data]);

    return (
        <div className='chooser-main'>
            <div className={classNames(classes.processToolbar, {
                'active-toolbar': selectedImages.length,
            })}
            >
                {selectedImages.length ?
                    <Toolbar
                        allItemsActive={data.length === selectedImages.length}
                        activeSidebar={'processed'}
                        onSelectAllImages={selectAllImages}
                        onDeleteSelectImages={deleteSelectedImages}
                    />
                    : null}

                <button
                    className={classNames(classes.downloadButton, {
                        [classes.passiveDownloadButton]: !data.length
                    })}
                    onClick={downloadImagesToZip}
                >
                    <i className={`icon-download ${classes.downloadIcon}`}/>
                    <span className={classes.downloadText}>Download</span>
                </button>
            </div>

            <div className='grid-container'>

                <Masonry
                    breakpointCols={BREAKPOINT_COLUMNS}
                    className={classNames('my-masonry-grid', {
                        'masonry-grid-Overwrite': data.length === 1,
                    })}
                    columnClassName='my-masonry-grid-column'
                >

                    {data.map((el, index) => {
                        const activeImage = selectedImages.some(selectedEl => selectedEl.key === el.key);

                        return (
                            <Img
                                key={`process_${el.key}`}
                                url={el.url}
                                id={el.key}
                                index={index}
                                status={el.status}
                                active={activeImage}
                                onClick={addSelectedImage}
                                handlePreviewShow={handlePreviewShow}
                            />
                        )
                    })}
                </Masonry>
            </div>
        </div>
    );
};

const useStyles = createUseStyles({
    processToolbar: {
        height: 50,
        paddingRight: 15,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'sticky',
        zIndex: 3,
        backgroundColor: '#fff',
        paddingTop: 30,
        paddingBottom: 15,
    },
    downloadButton: {
        width: 130,
        border: 'none',
        cursor: 'pointer',
        height: 40,
        outline: 'none',
        borderRadius: 3,
        backgroundColor: '#317ff3',
    },
    downloadIcon: {
        fontSize: 15,
    },
    downloadText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 200,
        marginLeft: 9,
    }
});

export default memo(Processed);
