const getNavigationEntryFromPerformanceTiming = () => {
    const timing = performance.timing;
    const type = performance.navigation.type;
    const navigationEntry = {
        entryType: 'navigation',
        startTime: 0,
        type: type == 2 ? 'back_forward' : type === 1 ? 'reload' : 'navigate',
    };
    for (const key in timing) {
        if (key !== 'navigationStart' && key !== 'toJSON') {
            navigationEntry[key] = Math.max(timing[key] -
                timing.navigationStart, 0);
        }
    }
    return navigationEntry;
};


export const getNavigationEntry = () => {
    if (window.__WEB_VITALS_POLYFILL__) {
        return (window.performance &&
            ((performance.getEntriesByType &&
                performance.getEntriesByType('navigation')[0]) ||
                getNavigationEntryFromPerformanceTiming()));
    }
    else {
        return (window.performance &&
            performance.getEntriesByType &&
            performance.getEntriesByType('navigation')[0]);
    }
};



export const getActivationStart = () => {
  const navEntry = getNavigationEntry();
  return (navEntry && navEntry.activationStart) || 0;
};







let bfcacheRestoreTime = -1;

export const getBFCacheRestoreTime = () => bfcacheRestoreTime;

export const onBFCacheRestore = (cb) => {
    addEventListener(
        'pageshow',
        (event) => {
            if (event.persisted) {
                bfcacheRestoreTime = event.timeStamp;
                cb(event);
            }
        },
        true
    );
};



let firstHiddenTime = -1;
const initHiddenTime = () => {
    return document.visibilityState === 'hidden' && !document.prerendering
        ? 0
        : Infinity;
};

const onVisibilityUpdate = (event) => {
    if (document.visibilityState === 'hidden' && firstHiddenTime > -1) {
        firstHiddenTime = event.type === 'visibilitychange' ? event.timeStamp : 0;
        removeChangeListeners();
    }
};

const addChangeListeners = () => {
    addEventListener('visibilitychange', onVisibilityUpdate, true);
    addEventListener('prerenderingchange', onVisibilityUpdate, true);
};

const removeChangeListeners = () => {
    removeEventListener('visibilitychange', onVisibilityUpdate, true);
    removeEventListener('prerenderingchange', onVisibilityUpdate, true);
};

export const getVisibilityWatcher = () => {
    if (firstHiddenTime < 0) {
        if (window.__WEB_VITALS_POLYFILL__) {
            firstHiddenTime = window.webVitals.firstHiddenTime;
            if (firstHiddenTime === Infinity) {
                addChangeListeners();
            }
        } else {
            firstHiddenTime = initHiddenTime();
            addChangeListeners();
        }

        onBFCacheRestore(() => {
            setTimeout(() => {
                firstHiddenTime = initHiddenTime();
                addChangeListeners();
            }, 0);
        });
    }
    return {
        get firstHiddenTime() {
            return firstHiddenTime;
        },
    };
};



const whenActivated = (callback) => {
    if (document.prerendering) {
        addEventListener('prerenderingchange', () => callback(), true);
    } else {
        callback();
    }
};



const LCPThresholds = [2500, 4000];
const reportedMetricIDs = {};
const onLCP = (onReport, opts) => {
    opts = opts || {};
    whenActivated(() => {
        const visibilityWatcher = getVisibilityWatcher();
        let metric = initMetric('LCP');
        let report;

        const handleEntries = (entries) => {
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
                if (lastEntry.startTime < visibilityWatcher.firstHiddenTime) {
                    metric.value = Math.max(
                        lastEntry.startTime - getActivationStart(),
                        0
                    );
                    metric.entries = [lastEntry];
                    report();
                }
            }
        };

        const po = observe('largest-contentful-paint', handleEntries);

        if (po) {
            report = bindReporter(
                onReport,
                metric,
                LCPThresholds,
                opts.reportAllChanges
            );

            const stopListening = runOnce(() => {
                if (!reportedMetricIDs[metric.id]) {
                    handleEntries(po.takeRecords());
                    po.disconnect();
                    reportedMetricIDs[metric.id] = true;
                    report(true);
                }
            });

            ['keydown', 'click'].forEach((type) => {
                addEventListener(type, stopListening, true);
            });
            onHidden(stopListening);
            onBFCacheRestore((event) => {
                metric = initMetric('LCP');
                report = bindReporter(
                    onReport,
                    metric,
                    LCPThresholds,
                    opts.reportAllChanges
                );

                doubleRAF(() => {
                    metric.value = performance.now() - event.timeStamp;
                    reportedMetricIDs[metric.id] = true;
                    report(true);
                });
            });
        }
    });
};
