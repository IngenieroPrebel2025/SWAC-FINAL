"""
Storage backend abstractions.

``BaseStorageBackend`` defines the interface that all concrete storage
implementations must satisfy.  ``LocalStorageBackend`` provides a
development-friendly implementation backed by Django's default file storage.

Usage::

    from infrastructure.storage.backends import LocalStorageBackend

    storage = LocalStorageBackend()
    url = storage.upload(file_obj, "uploads/avatar.png")
"""

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import IO, Any

__all__ = ["BaseStorageBackend", "LocalStorageBackend"]


# ---------------------------------------------------------------------------
# Abstract interface
# ---------------------------------------------------------------------------


class BaseStorageBackend(ABC):
    """Protocol that every storage backend must implement."""

    @abstractmethod
    def upload(self, file_obj: IO[bytes], path: str) -> str:
        """Upload *file_obj* to *path* and return the URL/key of the stored file.

        Args:
            file_obj: A readable binary file-like object.
            path:     Destination path / key within the storage system.

        Returns:
            The public URL or storage key of the uploaded file.
        """
        raise NotImplementedError

    @abstractmethod
    def download(self, path: str) -> bytes:
        """Return the raw bytes stored at *path*.

        Args:
            path: Path / key of the file to retrieve.

        Returns:
            File contents as bytes.

        Raises:
            FileNotFoundError: If *path* does not exist.
        """
        raise NotImplementedError

    @abstractmethod
    def delete(self, path: str) -> bool:
        """Delete the file at *path*.

        Args:
            path: Path / key of the file to delete.

        Returns:
            ``True`` if the file was deleted, ``False`` if it did not exist.
        """
        raise NotImplementedError

    @abstractmethod
    def exists(self, path: str) -> bool:
        """Return ``True`` if a file exists at *path*.

        Args:
            path: Path / key to check.
        """
        raise NotImplementedError

    @abstractmethod
    def get_url(self, path: str) -> str:
        """Return the public URL for the file at *path*.

        Args:
            path: Path / key of the stored file.

        Returns:
            Absolute URL string.
        """
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Local (development) backend
# ---------------------------------------------------------------------------


class LocalStorageBackend(BaseStorageBackend):
    """Development storage backend using Django's default file storage.

    Files are stored under ``settings.MEDIA_ROOT`` and served via
    ``settings.MEDIA_URL``.  Not suitable for production — use an object
    storage backend (e.g. Azure Blob, S3) instead.
    """

    def __init__(self) -> None:
        from django.core.files.storage import default_storage

        self._storage: Any = default_storage

    def upload(self, file_obj: IO[bytes], path: str) -> str:
        """Save *file_obj* using Django's default storage and return its URL."""
        from django.core.files.base import File

        saved_path: str = self._storage.save(path, File(file_obj))
        return self._storage.url(saved_path)

    def download(self, path: str) -> bytes:
        """Read and return raw bytes from *path*."""
        if not self._storage.exists(path):
            raise FileNotFoundError(f"No file found at path: {path!r}")

        with self._storage.open(path, "rb") as fh:
            return fh.read()

    def delete(self, path: str) -> bool:
        """Delete *path* from storage; returns ``False`` if it did not exist."""
        if not self._storage.exists(path):
            return False
        self._storage.delete(path)
        return True

    def exists(self, path: str) -> bool:
        """Return ``True`` if *path* exists in storage."""
        return bool(self._storage.exists(path))

    def get_url(self, path: str) -> str:
        """Return the public URL for the file at *path*."""
        return self._storage.url(path)
