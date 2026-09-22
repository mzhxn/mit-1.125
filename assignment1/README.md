# Assignment 1: Skills Compass — Massachusetts

Live website: https://massachusetts-workforce-skills.mzhxn.chatgpt.site

The Site currently requires owner access. Repository access does not grant access to the hosted Site.

## Local preview

From the repository root:

```sh
python3 -m http.server 8000 --directory assignment1/dist
```

Open http://localhost:8000.

## About the project

Static workforce planning website using real Massachusetts DER 2024–2034 projections, 2025 mean annual wages, and O*NET 31.0 skills.

Serve `dist` with a local HTTP server. No frontend build or third-party JavaScript is required. Google Fonts is optional; system font fallbacks remain usable offline.

## Refresh data

The source snapshot is preserved in `source-data`. Download updated files from the URLs in `dist/methodology.txt` and the O*NET database; preserve source versions and update years and retrieval dates deliberately. Run `python3 scripts/prepare_data.py` from this directory to regenerate the JSON and CSV files. The current app labels are pinned to the documented snapshot and must be updated when changing periods.

## Scope

634 occupations; 572 exact O*NET .00 matches. Current release does not contain workforce supply, IPEDS completions or training-program capacity. Those resources are linked as further research, not presented as analyzed evidence.

The website contains three visual analyses, filters, a sortable paginated table, CSV export, two rule-based training suggestions, a methodology download, and limitations.
