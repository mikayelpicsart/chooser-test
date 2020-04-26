import React, { memo, useCallback, useEffect, useState, useMemo, Fragment } from 'react';
import Masonry from 'react-masonry-css';
import toolChain from 'toolchain';
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
        <>
            <Fragment >

                <div
                    className={classNames('selected-toolbar', {
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
                        onClick={downloadImagesToZip}
                    >
                        <i className={`icon-download`}/>
                        <span>Download</span>
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

            </Fragment>
        </>
    );
};

// const useStyles = createUseStyles({
//     processToolbar: {
//         height: 50,
//         paddingRight: 15,
//         display: 'flex',
//         justifyContent: 'flex-end',
//         alignItems: 'center',
//         position: 'sticky',
//         zIndex: 3,
//         backgroundColor: '#fff',
//         paddingTop: 30,
//         paddingBottom: 15,
//     },
//     activeToolbar: {
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//     },
//     downloadButton: {
//         width: 130,
//         border: 'none',
//         cursor: 'pointer',
//         height: 40,
//         outline: 'none',
//         borderRadius: 3,
//         backgroundColor: '#317ff3',
//     },
//     downloadIcon: {
//         fontSize: 15,
//     },
//     downloadText: {
//         color: '#ffffff',
//         fontSize: 13,
//         fontWeight: 200,
//         marginLeft: 9,
//     },
//     gridContainer: {
//         display: 'flex',
//         flexWrap: 'wrap',
//     },
//     myMasonryGrid: {
//         display: 'flex',
//         width: 'auto',
//     },
//     myMasonryGridOverwrite: {
//         width: '100%',
//     },
//     myMasonryGridColumn: {
//         backgroundClip: 'padding-box',
//     },
//     imageContainer: {
//         position: 'relative',
//         marginBottom: 10,
//         marginRight: 10,
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//
//         '&:hover': {
//             '& div.preview': {
//                 display: 'block',
//             }
//         }
//     },
//     image: {
//         cursor: 'pointer',
//         objectFit: 'cover',
//         borderRadius: 10,
//     },
//     imagePending: {
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         position: 'absolute',
//         left: 0,
//         right: 0,
//         top: 0,
//         bottom: 0,
//         opacity: 0.5,
//         backgroundColor: '#fff'
//     },
//     selectedIconPosition: {
//         left: 8 + IMAGE_PADDING_SIZE,
//         bottom: 8 + IMAGE_PADDING_SIZE,
//         position: 'absolute',
//         cursor: 'pointer',
//     },
//     selectedIcon: {
//         fontSize: 22,
//     },
//     selectedImage: {
//         backgroundColor: '#d6e8fa',
//         border: `${IMAGE_BORDER_SIZE}px solid #a5caef`,
//         borderRadius: 10,
//         padding: IMAGE_PADDING_SIZE
//     },
//
//     deleteModal: {
//         width: 366,
//         left: '50%',
//         top: '50%',
//         position: 'absolute',
//         transform: 'translate(-50%, -50%)',
//         backgroundColor: 'white',
//         borderTop: '3px solid #3a76e8',
//         borderRadius: 6,
//         outline: 'none',
//     },
//     deleteModalOverlay: {
//         width: '100vw',
//         height: '100vh',
//         overflowX: 'hidden',
//         overflowY: 'auto',
//         position: 'fixed',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//         zIndex: 5,
//         backgroundColor: 'rgba(22, 26, 32, .9)',
//     },
//     deleteModalContent: {
//         width: '100%',
//         pointerEvents: 'auto',
//         display: 'flex',
//         flexDirection: 'column',
//         outline: 0,
//         borderRadius: '.3rem',
//         backgroundColor: '#fff',
//     },
//     deleteModalBody: {
//         width: 366,
//         height: 224,
//         borderRadius: 6.3,
//         backgroundColor: '#ffffff'
//     },
//     deleteModalHeader: {
//         position: 'absolute',
//         zIndex: 2,
//         top: 13,
//         right: 13,
//         cursor: 'pointer'
//     },
//     close: {
//         cursor: 'pointer',
//         float: 'right',
//         opacity: .5,
//         fontSize: 12
//     },
//     deleteModalText: {
//         width: 231,
//         height: 32,
//         marginTop: 85,
//         marginLeft: 68,
//         fontFamily: 'Montserrat',
//         fontSize: 11,
//         fontWeight: 'normal',
//         fontStretch: 'normal',
//         fontStyle: 'normal',
//         lineHeight: 1.45,
//         letterSpacing: 'normal',
//         textAlign: 'center',
//         color: '#86909c',
//     },
//     deleteModalChoice: {
//         display: 'flex',
//     },
//     deleteModalResolve: {
//         width: 112,
//         height: 36,
//         borderRadius: 4,
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         border: 'solid 0.9px #5897f0',
//         marginRight: 12,
//         marginLeft: 65,
//         fontSize: 11,
//         fontWeight: 600,
//         fontStretch: 'normal',
//         fontStyle: 'normal',
//         lineHeight: 1.45,
//         letterSpacing: 'normal',
//         color: '#5897f0',
//         cursor: 'pointer'
//     },
//     deleteModalReject: {
//         width: 112,
//         height: 36,
//         borderRadius: 4,
//         backgroundColor: '#4d8cee',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         fontSize: 11,
//         fontWeight: 600,
//         fontStretch: 'normal',
//         fontStyle: 'normal',
//         lineHeight: 1.45,
//         letterSpacing: 'normal',
//         color: '#fff',
//         cursor: 'pointer'
//     },
//     selectedPreviewIcon: {
//         fontSize: 20,
//
//         '&:before': {
//             color: `rgba(0, 0, 0, 0.3)`
//         }
//     },
//     selectedPreviewPosition: {
//         left: 8 + IMAGE_PADDING_SIZE,
//         top: 8 + IMAGE_PADDING_SIZE,
//         position: 'absolute',
//         borderRadius: 6,
//         cursor: 'pointer',
//         display: 'none',
//     },
//     overlay: {
//         position: 'relative',
//         display: 'flex',
//         alignItems: 'center',
//
//         '&:after': {
//             content: '\'\'',
//             position: 'absolute',
//             width: '100%',
//             height: '100%',
//             cursor: 'pointer',
//             borderRadius: 10,
//             top: 0,
//             left: 0,
//             background: `rgba(0, 0, 0, 0.3)`,
//             opacity: 0,
//             transition: 'all 0.3s',
//         },
//
//         '&:hover:after': {
//             opacity: .5,
//         },
//     }
// });

export default memo(Processed);
