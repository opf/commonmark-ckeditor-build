# Mermaid diagrams

A `mermaid` block widget holding diagram source, shown as a source textarea, a rendered preview, or
both side by side. Load the `Mermaid` glue plugin; it pulls in `MermaidEditing`, `MermaidToolbar`
and `MermaidUI`.

| File | Role |
|---|---|
| `mermaid.js` | Glue plugin |
| `mermaid_editing.js` | Schema, conversion, and the renderer (`renderMermaid`) |
| `mermaid_ui.js` | The insert button with its optional template dropdown, the mode buttons, the info button |
| `mermaid_toolbar.js` | Registers the balloon toolbar shown when a diagram is selected |
| `insert_mermaid_command.js` | Inserts a blank or pre-filled diagram |
| `mermaid_{preview,source_view,split_view}_command.js` | Switch the widget's `displayMode` |
| `utils.js` | `debounce` for the source textarea, `checkIsOn` for button state |

## The mermaid library is not a dependency

The plugin never imports mermaid - bundling it pulls in d3, cytoscape and katex, which pushed this
build's Terser stage past ten minutes. The host passes the library in through editor config:

```js
mermaid: {
    lazyLoad: () => import( 'mermaid' ).then( m => m.default ),
    config: { /* mermaid initialize() config */ },
    samples: [ /* { name, content } diagram templates for the insert dropdown */ ],
    openHelp: () => { /* opens https://mermaid.js.org/intro/ when not given */ }
}
```

`renderMermaid` calls `lazyLoad` once, memoises the promise, and calls `initialize()` on the
resolved instance. Without it the widget still edits and round-trips its source; only the preview
stays empty. Renders are generation-stamped so a slow render that has been superseded cannot
overwrite a newer one, and a failed render shows the error message in place.

## Round-trip

A diagram is content, not markup: it round-trips as a fenced `mermaid` code block, upcast from
`pre > code.language-mermaid` and downcast back to it. The upcast runs on `element:pre` at
`highest` priority because this build's own code block plugin claims every `<pre>` on `high` and
consumes the `<code>` inside it without dispatching it.

Upstream also persists the picked display mode on the `<code>` element. That is dropped here: the
data format is CommonMark, so an attribute on `<code>` never survives the round trip and every
diagram opens in split mode.

## Provenance

Vendored from [Trilium](https://github.com/TriliumNext/Trilium)'s
`packages/ckeditor5/src/plugins/mermaid`, itself derived from CKSource's
`@ckeditor/ckeditor5-mermaid`, copyright CKSource Holding sp. z o.o., used under the
GPL-2.0-or-later arm of its license - see `LICENSE.md` next to this file. Converted from TypeScript
to JavaScript and retargeted at this build's individual `@ckeditor/ckeditor5-*` packages.
