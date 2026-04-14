from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator


@dataclass
class UnifiedRecord:
    source_term: str
    source_lang: str
    target_term: str
    target_lang: str
    relation_type: str
    confidence: float
    source_dataset: str
    concept: str | None = None
    source_gloss: str | None = None
    target_gloss: str | None = None


class BaseParser(ABC):
    dataset_name: str

    @abstractmethod
    def parse(self, raw_dir: Path) -> Iterator[UnifiedRecord]:
        ...
