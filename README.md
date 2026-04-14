# Etymograph

An etymology knowledge graph explorer. Search any word, trace its origins across languages, compare cognates side by side, and find hidden connections between words you'd never expect.

Built on top of five open etymology datasets, unified into a single SQLite database with 22.7 million relations across 6.6 million words in 5,529 languages.

## Features

### Trace Mode
Type any word and explore its etymological tree. See where it came from, what it's related to, and how it connects to words in other languages. The graph uses force-directed layout with depth-based coloring so you can tell at a glance how far back a connection goes.

### Ancestors / Descendants
Click "Ancestors" to see the clean derivation chain of a word going back to its oldest known root, no branching, no noise. Click "Descendants" to see what words were derived from it going forward. Both show a split view with a timeline on the left and a graph on the right.

### Connect Mode
Pick two words and find the shortest etymological path between them. Works across languages. How is English "salary" connected to French "salade"? Both go back to Latin "sal" (salt).

### Compare Mode
See how the same concept appears across language families. Type "water" and see the Germanic forms (water, Wasser, vatten), Romance forms (eau, agua, acqua), Slavic forms (voda, woda), and more, all grouped by family.

### Dictionary Definitions
Click any word node to open the detail panel. For modern languages (English, French, Spanish, German, and others), it pulls live dictionary definitions from the Free Dictionary API, including part of speech, example sentences, and audio pronunciation.

### Filters
Control the depth of exploration, limit the number of results, toggle specific relation types (cognate, derived, borrowed, inherited, compound, false friend), filter by language family, and hide noisy affixed forms (un-, re-, -ment, -tion, etc.).

## The Data

Five datasets, normalized into a single schema:

| Dataset | Relations | What it covers |
|---|---|---|
| CogNet v2.0 | 8.1M | Cognate pairs across 338 languages |
| Etymological Wordnet | 6.0M | Etymology relationships from Wiktionary |
| Etymology Atlas | 4.2M | Wiktionary-derived etymology with typed relations |
| etymology-db | 3.8M | Structured Wiktionary parses |
| EtymDB 2.1 | 0.6M | Curated etymological links |

The unified dataset is available on [Hugging Face](https://huggingface.co/datasets/danielquillanroxas/etymograph-unified).

## Tech Stack

- **Backend**: FastAPI + SQLite with FTS5 full-text search
- **Frontend**: React + TypeScript + Vite + Cytoscape.js for graph visualization
- **Pipeline**: Python scripts that download, parse, normalize, and load all five datasets
- **Dictionary**: Free Dictionary API (dictionaryapi.dev) for live definitions

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### Pipeline (build the database)

This downloads and processes all five datasets into a single SQLite database. Takes a while depending on your connection.

```bash
cd pipeline
pip install -r requirements.txt
python run_pipeline.py
```

The database lands at `data/etymograph.db` (~3.5 GB). Or grab the pre-built version from [Hugging Face](https://huggingface.co/datasets/danielquillanroxas/etymograph-unified).

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5174 and start tracing.

## Project Structure

```
etymograph/
  backend/
    app/
      main.py          # FastAPI app, CORS, router registration
      models.py         # Pydantic models (TraceRequest, WordDetail, etc.)
      database.py       # SQLite connection pool
      config.py         # BFS limits, DB path
      routers/          # API endpoints (search, trace, connect, compare, word)
      services/         # Graph search algorithms (BFS, lineage, descendants)
  frontend/
    src/
      App.tsx           # Main app with search, mode toggle, filters
      components/       # GraphCanvas, LineageView, CompareView, WordDetailPanel
      api/              # Backend client + Free Dictionary API integration
      hooks/            # useTrace, useConnect
      styles/           # Cytoscape graph stylesheet
      utils/            # Language name mapping (ISO 639-3 to full names)
  pipeline/
    run_pipeline.py     # Orchestrator
    download.py         # Dataset downloader
    parsers/            # One parser per dataset
    normalize.py        # Relation type + language code normalization
    loader.py           # SQLite bulk loader with FTS5
    config.py           # Download URLs, normalization mappings
```

## Citations

If you use the dataset or build on this project, please cite the underlying sources:

- Batsuren et al., 2019. *CogNet: A Large-Scale Cognate Database.* ACL.
- de Melo, 2014. *Etymological Wordnet: Tracing the History of Words.* LREC.
- Fourrier & Sagot, 2020. *Methodological Choices in the Construction of EtymDB 2.1.* LT4HALA.
- Roher, 2020. etymology-db. github.com/droher/etymology-db

## License

MIT
