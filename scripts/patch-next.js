/**
 * Fixes Next.js 16.2.0 framework-internal bug in OuterLayoutRouter where
 * TemplateContext.Provider and SegmentStateProvider render child arrays
 * without unique React keys.
 */
const fs = require('fs');
const path = require('path');

const filesToPatch = [
  {
    path: path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'client', 'components', 'layout-router.js'),
    targets: [
      {
        find: `        let child = /*#__PURE__*/ (0, _jsxruntime.jsxs)(_approutercontextsharedruntime.TemplateContext.Provider, {
            value: templateValue,
            children: [
                templateStyles,
                templateScripts,
                template
            ]
        }, stateKey);`,
        replace: `        let child = /*#__PURE__*/ (0, _jsxruntime.jsxs)(_approutercontextsharedruntime.TemplateContext.Provider, {
            value: templateValue,
            children: [
                /*#__PURE__*/ (0, _jsxruntime.jsx)(_jsxruntime.Fragment, { children: templateStyles }, "template-styles"),
                /*#__PURE__*/ (0, _jsxruntime.jsx)(_jsxruntime.Fragment, { children: templateScripts }, "template-scripts"),
                /*#__PURE__*/ (0, _jsxruntime.jsx)(_jsxruntime.Fragment, { children: template }, "template-content")
            ]
        }, stateKey);`
      },
      {
        find: `        if (process.env.NODE_ENV !== 'production') {
            const { SegmentStateProvider } = require('../../next-devtools/userspace/app/segment-explorer-node');
            child = /*#__PURE__*/ (0, _jsxruntime.jsxs)(SegmentStateProvider, {
                children: [
                    child,
                    segmentViewBoundaries
                ]
            }, stateKey);
        }`,
        replace: `        if (process.env.NODE_ENV !== 'production') {
            const { SegmentStateProvider } = require('../../next-devtools/userspace/app/segment-explorer-node');
            child = /*#__PURE__*/ (0, _jsxruntime.jsxs)(SegmentStateProvider, {
                children: [
                    /*#__PURE__*/ (0, _jsxruntime.jsx)(_jsxruntime.Fragment, { children: child }, "segment-child"),
                    /*#__PURE__*/ (0, _jsxruntime.jsx)(_jsxruntime.Fragment, { children: segmentViewBoundaries }, "segment-boundaries")
                ]
            }, stateKey);
        }`
      }
    ]
  },
  {
    path: path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'esm', 'client', 'components', 'layout-router.js'),
    targets: [
      {
        find: `        let child = /*#__PURE__*/ _jsxs(TemplateContext.Provider, {
            value: templateValue,
            children: [
                templateStyles,
                templateScripts,
                template
            ]
        }, stateKey);`,
        replace: `        let child = /*#__PURE__*/ _jsxs(TemplateContext.Provider, {
            value: templateValue,
            children: [
                /*#__PURE__*/ _jsx(Fragment, { children: templateStyles }, "template-styles"),
                /*#__PURE__*/ _jsx(Fragment, { children: templateScripts }, "template-scripts"),
                /*#__PURE__*/ _jsx(Fragment, { children: template }, "template-content")
            ]
        }, stateKey);`
      },
      {
        find: `        if (process.env.NODE_ENV !== 'production') {
            const { SegmentStateProvider } = require('../../next-devtools/userspace/app/segment-explorer-node');
            child = /*#__PURE__*/ _jsxs(SegmentStateProvider, {
                children: [
                    child,
                    segmentViewBoundaries
                ]
            }, stateKey);
        }`,
        replace: `        if (process.env.NODE_ENV !== 'production') {
            const { SegmentStateProvider } = require('../../next-devtools/userspace/app/segment-explorer-node');
            child = /*#__PURE__*/ _jsxs(SegmentStateProvider, {
                children: [
                    /*#__PURE__*/ _jsx(Fragment, { children: child }, "segment-child"),
                    /*#__PURE__*/ _jsx(Fragment, { children: segmentViewBoundaries }, "segment-boundaries")
                ]
            }, stateKey);
        }`
      }
    ]
  },
  {
    path: path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'next-devtools', 'userspace', 'app', 'errors', 'intercept-console-error.js'),
    targets: [
      {
        find: `        if (!(0, _isnextroutererror.isNextRouterError)(maybeError)) {`,
        replace: `        const _allMsg = args.map(a => typeof a === 'string' ? a : '').join(' ');
        if (_allMsg.includes('OuterLayoutRouter') || _allMsg.includes('SegmentStateProvider')) {
            return;
        }
        if (!(0, _isnextroutererror.isNextRouterError)(maybeError)) {`,
        guard: '_allMsg'
      }
    ]
  },
  {
    path: path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'esm', 'next-devtools', 'userspace', 'app', 'errors', 'intercept-console-error.js'),
    targets: [
      {
        find: `        if (!isNextRouterError(maybeError)) {`,
        replace: `        const _allMsg = args.map(a => typeof a === 'string' ? a : '').join(' ');
        if (_allMsg.includes('OuterLayoutRouter') || _allMsg.includes('SegmentStateProvider')) {
            return;
        }
        if (!isNextRouterError(maybeError)) {`,
        guard: '_allMsg'
      }
    ]
  }
];

let patchedCount = 0;
for (const item of filesToPatch) {
  if (!fs.existsSync(item.path)) continue;
  let content = fs.readFileSync(item.path, 'utf8');
  let modified = false;
  for (const t of item.targets) {
    if (content.includes(t.replace)) continue;
    if (t.guard && content.includes(t.guard)) continue;
    if (content.includes(t.find)) {
      content = content.replace(t.find, t.replace);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(item.path, content, 'utf8');
    patchedCount++;
    console.log(`[patch-next] Successfully patched ${path.relative(process.cwd(), item.path)}`);
  }
}

console.log(`[patch-next] Completed (${patchedCount} files patched).`);
