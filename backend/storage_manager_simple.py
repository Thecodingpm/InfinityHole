import os
import json
import hashlib
import time
from typing import Dict, List, Optional, Tuple
from abc import ABC, abstractmethod

class StorageProvider(ABC):
    """Abstract base class for storage providers"""
    
    @abstractmethod
    def upload_file(self, file_content: bytes, filename: str, user_id: str) -> Tuple[str, str]:
        """Upload file and return (download_url, file_id)"""
        pass
    
    @abstractmethod
    def delete_file(self, file_id: str, user_id: str) -> bool:
        """Delete file and return success status"""
        pass
    
    @abstractmethod
    def get_file_info(self, file_id: str, user_id: str) -> Optional[Dict]:
        """Get file information"""
        pass

class LocalStorageProvider(StorageProvider):
    """Local file system storage provider"""
    
    def __init__(self, base_path: str = "downloads"):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)
    
    def upload_file(self, file_content: bytes, filename: str, user_id: str) -> Tuple[str, str]:
        """Upload file to local storage"""
        try:
            # Create user directory
            user_dir = os.path.join(self.base_path, user_id)
            os.makedirs(user_dir, exist_ok=True)
            
            # Generate unique filename
            file_id = hashlib.md5(f"{user_id}_{filename}_{time.time()}".encode()).hexdigest()
            file_path = os.path.join(user_dir, f"{file_id}_{filename}")
            
            # Write file
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            # Return local file path as URL (for development)
            download_url = f"/downloads/{user_id}/{file_id}_{filename}"
            return download_url, file_id
            
        except Exception as e:
            raise Exception(f"Local storage upload failed: {str(e)}")
    
    def delete_file(self, file_id: str, user_id: str) -> bool:
        """Delete file from local storage"""
        try:
            user_dir = os.path.join(self.base_path, user_id)
            for filename in os.listdir(user_dir):
                if filename.startswith(file_id):
                    file_path = os.path.join(user_dir, filename)
                    os.remove(file_path)
                    return True
            return False
        except Exception:
            return False
    
    def get_file_info(self, file_id: str, user_id: str) -> Optional[Dict]:
        """Get file information from local storage"""
        try:
            user_dir = os.path.join(self.base_path, user_id)
            for filename in os.listdir(user_dir):
                if filename.startswith(file_id):
                    file_path = os.path.join(user_dir, filename)
                    stat = os.stat(file_path)
                    return {
                        "file_id": file_id,
                        "filename": filename,
                        "size": stat.st_size,
                        "created_at": stat.st_ctime,
                        "download_url": f"/downloads/{user_id}/{filename}"
                    }
            return None
        except Exception:
            return None

class StorageManager:
    """Simplified storage manager for basic functionality"""
    
    def __init__(self):
        self.providers = {
            "local": LocalStorageProvider()
        }
        self.user_preferences = {}
        self.load_preferences()
    
    def load_preferences(self):
        """Load user storage preferences"""
        try:
            if os.path.exists("user_storage_preferences.json"):
                with open("user_storage_preferences.json", "r") as f:
                    self.user_preferences = json.load(f)
        except Exception:
            self.user_preferences = {}
    
    def save_preferences(self):
        """Save user storage preferences"""
        try:
            with open("user_storage_preferences.json", "w") as f:
                json.dump(self.user_preferences, f, indent=2)
        except Exception:
            pass
    
    def get_user_provider(self, user_id: str) -> StorageProvider:
        """Get storage provider for user"""
        provider_name = self.user_preferences.get(user_id, "local")
        return self.providers.get(provider_name, self.providers["local"])
    
    def set_user_provider(self, user_id: str, provider: str):
        """Set storage provider for user"""
        if provider in self.providers:
            self.user_preferences[user_id] = provider
            self.save_preferences()
    
    def upload_file(self, file_content: bytes, filename: str, user_id: str) -> Tuple[str, str]:
        """Upload file using user's preferred provider"""
        provider = self.get_user_provider(user_id)
        return provider.upload_file(file_content, filename, user_id)
    
    def delete_file(self, file_id: str, user_id: str) -> bool:
        """Delete file using user's preferred provider"""
        provider = self.get_user_provider(user_id)
        return provider.delete_file(file_id, user_id)
    
    def get_file_info(self, file_id: str, user_id: str) -> Optional[Dict]:
        """Get file information using user's preferred provider"""
        provider = self.get_user_provider(user_id)
        return provider.get_file_info(file_id, user_id)

# Create global storage manager instance
storage_manager = StorageManager()
