import React, { memo, useCallback, useEffect, useState, useMemo, Fragment } from 'react';
import { createUseStyles } from 'react-jss';
import Masonry from 'react-masonry-css';
import { BREAKPOINT_COLUMNS, IMAGE_BORDER_SIZE, IMAGE_PADDING_SIZE } from 'Chooser/configs';
import IndexedDBService from 'utils/indexedDBService';
import toolChain from 'toolchain';
import classNames from 'classnames';
import {
    Toolbar,
    DeleteModal,
    PreviewModal
} from '@PicsArtWeb/react-ui-library';

const JSZip = require('jszip');
const FileSaver = require('file-saver');

const mimeTypesToFormat = {
    'image/jpeg': 'jpeg',
    'image/png': 'png'
};

function ImgNoMemo(props) {
    const classes = useStyles();

    const { id, onClick: emitOnClick, blob, showBlob, url, ...rest } = props;

    const handlerClick = useCallback((e) => emitOnClick(id), [emitOnClick, id]);

    return (
        <img
            className={classes.image}
            onClick={handlerClick}
            alt=""
            src={showBlob ? URL.createObjectURL(blob) : url} {...rest} />
    );
}

const Img = memo(ImgNoMemo);

const Processed = () => {
    const classes = useStyles();
    const [data, setData] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [deleteModalShow, setDeleteModalShow] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [imageDataUrl, setImageDataUrl] = useState('');
    const [doneImagesCount, setDoneImagesCount] = useState(0);

    const handlerReady = useCallback(async (key) => {
        const current = await IndexedDBService.loadDataByKey(key) || {};
        setData((prvData) => [...prvData.map(item => item.key === key ? ({ ...current }) : item)]);
    }, []);

    useEffect(() => {

        let unsubscribe = null;

        (async () => {
            const allData = await IndexedDBService.loadAllData() || [];
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
        setDoneImagesCount(data.filter(el => el.status === 'done').length);

        if (ifHasPending) {
            window.addEventListener('beforeunload', handlerBeforeunload, false);
        }
        return () => {
            if (ifHasPending) {
                window.removeEventListener('beforeunload', handlerBeforeunload, false);
            }
        };
    }, [data, handlerBeforeunload]);

    const addSelectedImage = useCallback((key) => {
        setSelectedImages((prevSelectedImages) => {
            const deselectImage = prevSelectedImages.find((img) => img.key === key);

            if (deselectImage) {
                const newArray = prevSelectedImages.filter((elem) => elem.key !== key);

                return [...newArray];
            }
            return [...prevSelectedImages, { key }];
        });
    }, []);

    const downloadImagesToZip = useCallback(() => {

        const zip = new JSZip();
        const img = zip.folder('PicsArt Bulk Images');

        Promise.all((selectedImages.length ? selectedImages : data).map(el => {
            return IndexedDBService.loadDataByKey(el.key);
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
                await IndexedDBService.removeDataByKey(el.key);
            });
        });

    }, [selectedImages, data]);

    const selectAllImages = useCallback(() => {
        if (data.length === selectedImages.length) {
            setSelectedImages([]);

            return;
        }

        setSelectedImages(data.filter(el => el.status === 'done'));
    }, [data, selectedImages.length]);

    const deleteSelectedImages = useCallback(({ type }) => {

        if (type === 'deleteImages') {
            selectedImages.forEach(async el => {
                await IndexedDBService.removeDataByKey(el.key);
            });

            setDeleteModalShow(false);
            const newData = data.filter(el => !selectedImages.map(elem => elem.key).includes(el.key));
            setData(newData);
            setSelectedImages([]);
            return;
        }

        setDeleteModalShow(false);
    }, [selectedImages, data]);

    const showDeleteModal = useCallback(() => {
        setDeleteModalShow(true);
    }, []);

    const handlePreviewShow = useCallback(async (key, e) => {
        e.stopPropagation();

        const current = await IndexedDBService.loadDataByKey(key) || {};

        setShowPreviewModal(true);
        setImageDataUrl(URL.createObjectURL(current.blob));

    }, []);

    const handleCallBack = useCallback(() => {
        setShowPreviewModal(false);
    }, []);

    useMemo(() => {
        data.sort((a, b) => +b.key - +a.key);
    }, [data]);

    return (
        <>
            <Fragment >

                <div className={classNames(classes.processToolbar, {
                    [classes.activeToolbar]: selectedImages.length
                })}>
                    {selectedImages.length ?
                        <Toolbar
                            allItemsActive={data.length === selectedImages.length}
                            activeSidebar={'processed'}
                            onSelectAllImages={selectAllImages}
                            onDeleteSelectImages={showDeleteModal}
                        />
                        : null}

                    <button
                        className={classes.downloadButton}
                        onClick={downloadImagesToZip}
                    >
                        <i className={`icon-download ${classes.downloadIcon}`}/>
                        <span className={classes.downloadText}>Download</span>
                    </button>
                </div>

                <PreviewModal show={showPreviewModal}
                              handleCallBack={handleCallBack}
                              imageSrc={imageDataUrl}
                />

                {deleteModalShow ? <DeleteModal
                    show={deleteModalShow}
                    handleCallBack={deleteSelectedImages}
                /> : <></>}

                <div className={classes.gridContainer}>

                    <Masonry
                        breakpointCols={BREAKPOINT_COLUMNS}
                        className={classNames(classes.myMasonryGrid, {
                            [classes.myMasonryGridOverwrite]: data.length === 1

                        })}
                        columnClassName={classes.myMasonryGridColumn}>

                        {data.map(el => {
                            const activeImage = selectedImages.some(selectedEl => selectedEl.key === el.key);

                            return (
                                <div key={`${el.key}`}
                                     className={classNames(classes.imageContainer, {
                                         [classes.selectedImage]: activeImage
                                     })}
                                >

                                    <div
                                        className={classes.overlay}
                                        onClick={() => addSelectedImage(el.key)}>
                                        <Img
                                            width="100%"
                                            showBlob={(el.status === 'done')}
                                            blob={el.blobResize}
                                            url={`${el.url}?type=webp&to=crop&r=480`}
                                            id={el.key}
                                        />
                                    </div>

                                    {(['pending', 'error'].includes(el.status)) &&
                                    <div className={classes.imagePending}>
                                        {el.status === 'pending' ? 'Processing' : 'Error'}
                                    </div>
                                    }

                                    <div
                                        className={`${classes.selectedPreviewPosition} preview`}
                                        onClick={(e) => handlePreviewShow(el.key, e)}
                                    >
                                        <i className={`icon-preview ${classes.selectedPreviewIcon}`}/>
                                    </div>

                                    {activeImage && (

                                        <div
                                            className={classes.selectedIconPosition}
                                            onClick={() => addSelectedImage(el.key)}>
                                            <i className={`icon-checked path1 ${classes.selectedIcon}`}/>
                                            <i className={`icon-checked path2 ${classes.selectedIcon}`}/>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </Masonry>
                </div>

            </Fragment>
        </>
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
    activeToolbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    },
    gridContainer: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    myMasonryGrid: {
        display: 'flex',
        width: 'auto',
    },
    myMasonryGridOverwrite: {
        width: '100%',
    },
    myMasonryGridColumn: {
        backgroundClip: 'padding-box',
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 10,
        marginRight: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        '&:hover': {
            '& div.preview': {
                display: 'block',
            }
        }
    },
    image: {
        cursor: 'pointer',
        objectFit: 'cover',
        borderRadius: 10,
    },
    imagePending: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        opacity: 0.5,
        backgroundColor: '#fff'
    },
    selectedIconPosition: {
        left: 8 + IMAGE_PADDING_SIZE,
        bottom: 8 + IMAGE_PADDING_SIZE,
        position: 'absolute',
        cursor: 'pointer',
    },
    selectedIcon: {
        fontSize: 22,
    },
    selectedImage: {
        backgroundColor: '#d6e8fa',
        border: `${IMAGE_BORDER_SIZE}px solid #a5caef`,
        borderRadius: 10,
        padding: IMAGE_PADDING_SIZE
    },

    deleteModal: {
        width: 366,
        left: '50%',
        top: '50%',
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        borderTop: '3px solid #3a76e8',
        borderRadius: 6,
        outline: 'none',
    },
    deleteModalOverlay: {
        width: '100vw',
        height: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 5,
        backgroundColor: 'rgba(22, 26, 32, .9)',
    },
    deleteModalContent: {
        width: '100%',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        outline: 0,
        borderRadius: '.3rem',
        backgroundColor: '#fff',
    },
    deleteModalBody: {
        width: 366,
        height: 224,
        borderRadius: 6.3,
        backgroundColor: '#ffffff'
    },
    deleteModalHeader: {
        position: 'absolute',
        zIndex: 2,
        top: 13,
        right: 13,
        cursor: 'pointer'
    },
    close: {
        cursor: 'pointer',
        float: 'right',
        opacity: .5,
        fontSize: 12
    },
    deleteModalText: {
        width: 231,
        height: 32,
        marginTop: 85,
        marginLeft: 68,
        fontFamily: 'Montserrat',
        fontSize: 11,
        fontWeight: 'normal',
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.45,
        letterSpacing: 'normal',
        textAlign: 'center',
        color: '#86909c',
    },
    deleteModalChoice: {
        display: 'flex',
    },
    deleteModalResolve: {
        width: 112,
        height: 36,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'solid 0.9px #5897f0',
        marginRight: 12,
        marginLeft: 65,
        fontSize: 11,
        fontWeight: 600,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.45,
        letterSpacing: 'normal',
        color: '#5897f0',
        cursor: 'pointer'
    },
    deleteModalReject: {
        width: 112,
        height: 36,
        borderRadius: 4,
        backgroundColor: '#4d8cee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 600,
        fontStretch: 'normal',
        fontStyle: 'normal',
        lineHeight: 1.45,
        letterSpacing: 'normal',
        color: '#fff',
        cursor: 'pointer'
    },
    selectedPreviewIcon: {
        fontSize: 20,

        '&:before': {
            color: `rgba(0, 0, 0, 0.3)`
        }
    },
    selectedPreviewPosition: {
        left: 8 + IMAGE_PADDING_SIZE,
        top: 8 + IMAGE_PADDING_SIZE,
        position: 'absolute',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'none',
    },
    overlay: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',

        '&:after': {
            content: '\'\'',
            position: 'absolute',
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            borderRadius: 10,
            top: 0,
            left: 0,
            background: `rgba(0, 0, 0, 0.3)`,
            opacity: 0,
            transition: 'all 0.3s',
        },

        '&:hover:after': {
            opacity: .5,
        },
    }
});

export default memo(Processed);
