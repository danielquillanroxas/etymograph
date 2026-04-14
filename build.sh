#!/usr/bin/env bash
set -o errexit

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Install backend deps
cd backend
pip install -r requirements.txt
cd ..

# Download database from HuggingFace (if not already present)
if [ ! -f data/etymograph.db ]; then
  echo "Downloading etymograph.db from HuggingFace..."
  mkdir -p data
  pip install huggingface_hub
  python -c "
from huggingface_hub import hf_hub_download
hf_hub_download(
    repo_id='danielquillanroxas/etymograph-unified',
    filename='etymograph.db',
    repo_type='dataset',
    local_dir='data',
)
print('Database downloaded.')
"
fi
