# kse_sociology

- `src/` - a js app that fetches data
_ `exploration/` -- jupyter notebooks where the research is done

## Data fetching

```bash
bun install
bun run src/index.ts
```

This will output a `companies_eu.arrow` file, that can be used for python analysis

## Research

```bash
cd exploration
python -m venv venv
source ./venv/bin/activate
pip install --upgrade -r requirements.txt
jupyter notebook
```

