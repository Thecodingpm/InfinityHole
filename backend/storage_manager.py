import os
import json
import hashlib
import time
from typing import Dict, List, Optional, Tuple
from abc import ABC, abstractmethod
import firebase_admin
from firebase_admin import credentials, storage as firebase_storage
import cloudinary
import cloudinary.uploader
import cloudinary.api
from google.cloud import storage as gcs
import boto3
from botocore.exceptions import ClientError

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
    
    @abstractmethod
    def list_files(self, user_id: str) -> List[Dict]:
        """List all files for a user"""
        pass
    
    @abstractmethod
    def get_quota_usage(self, user_id: str) -> Tuple[float, float]:
        """Get current usage and limit in MB"""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if storage provider is available"""
        pass

class FirebaseStorageProvider(StorageProvider):
    """Firebase Storage implementation"""
    
    def __init__(self):
        self.bucket_name = "infinityhole-e4e92.appspot.com"  # Default Firebase Storage bucket
        self.quota_limit_mb = 100  # 100MB free tier
        
        # Initialize Firebase Admin SDK
        try:
            if not firebase_admin._apps:
                # Check if service account file exists
                service_account_path = "firebase-service-account.json"
                if os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': self.bucket_name
                    })
                    self.bucket = firebase_storage.bucket()
                    self.available = True
                    print("✅ Firebase Storage initialized with service account")
                else:
                    print("⚠️ Firebase service account file not found - using fallback")
                    self.available = False
            else:
                self.bucket = firebase_storage.bucket()
                self.available = True
        except Exception as e:
            print(f"⚠️ Firebase Storage initialization failed: {e}")
            self.available = False
    
    def upload_file(self, file_content: bytes, filename: str, user_id: str) -> Tuple[str, str]:
        if not self.available:
            raise Exception("Firebase Storage not available")
        
        try:
            # Create unique filename
            timestamp = int(time.time())
            file_id = f"{timestamp}_{filename}"
            blob_path = f"users/{user_id}/files/{file_id}"
            
            # Upload to Firebase Storage
            blob = self.bucket.blob(blob_path)
            blob.upload_from_string(file_content)
            
            # Make blob publicly accessible
            blob.make_public()
            download_url = blob.public_url
            
            return download_url, file_id
        except Exception as e:
            raise Exception(f"Firebase upload failed: {e}")
    
    def delete_file(self, file_id: str, user_id: str) -> bool:
        if not self.available:
            return False
        
        try:
            blob_path = f"users/{user_id}/files/{file_id}"
            blob = self.bucket.blob(blob_path)
            blob.delete()
            return True
        except Exception as e:
            print(f"Firebase delete failed: {e}")
            return False
    
    def get_file_info(self, file_id: str, user_id: str) -> Optional[Dict]:
        if not self.available:
            return None
        
        try:
            blob_path = f"users/{user_id}/files/{file_id}"
            blob = self.bucket.blob(blob_path)
            
            if not blob.exists():
                return None
            
            blob.reload()
            return {
                "id": file_id,
                "name": file_id.split("_", 1)[1] if "_" in file_id else file_id,
                "size": blob.size,
                "content_type": blob.content_type,
                "created": blob.time_created.isoformat() if blob.time_created else None,
                "download_url": blob.public_url
            }
        except Exception as e:
            print(f"Firebase get file info failed: {e}")
            return None
    
    def list_files(self, user_id: str) -> List[Dict]:
        if not self.available:
            return []
        
        try:
            prefix = f"users/{user_id}/files/"
            blobs = self.bucket.list_blobs(prefix=prefix)
            
            files = []
            for blob in blobs:
                file_id = blob.name.split("/")[-1]
                files.append({
                    "id": file_id,
                    "name": file_id.split("_", 1)[1] if "_" in file_id else file_id,
                    "size": blob.size,
                    "content_type": blob.content_type,
                    "created": blob.time_created.isoformat() if blob.time_created else None,
                    "download_url": blob.public_url
                })
            
            return files
        except Exception as e:
            print(f"Firebase list files failed: {e}")
            return []
    
    def get_quota_usage(self, user_id: str) -> Tuple[float, float]:
        if not self.available:
            return 0.0, 0.0
        
        try:
            files = self.list_files(user_id)
            total_size = sum(file["size"] for file in files)
            usage_mb = total_size / (1024 * 1024)
            return usage_mb, self.quota_limit_mb
        except Exception as e:
            print(f"Firebase quota check failed: {e}")
            return 0.0, 0.0
    
    def is_available(self) -> bool:
        return self.available

class CloudinaryStorageProvider(StorageProvider):
    """Cloudinary implementation"""
    
    def __init__(self):
        self.quota_limit_mb = 25000  # 25GB free tier (in MB)
        
        # Initialize Cloudinary with your credentials
        try:
            cloudinary.config(
                cloud_name="divqd00jz",
                api_key="334276419162313",
                api_secret="PUeTvSmRcz3VPFrwkO-CQKq5cPE"
            )
            self.available = True
            print("✅ Cloudinary configured with your credentials")
        except Exception as e:
            print(f"Cloudinary initialization failed: {e}")
            self.available = False
    
    def upload_file(self, file_content: bytes, filename: str, user_id: str) -> Tuple[str, str]:
        if not self.available:
            raise Exception("Cloudinary not available")
        
        try:
            # Create unique public_id
            timestamp = int(time.time())
            file_id = f"{timestamp}_{filename}"
            public_id = f"infinityhole/users/{user_id}/{file_id}"
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file_content,
                public_id=public_id,
                resource_type="auto"
            )
            
            return result["secure_url"], file_id
        except Exception as e:
            raise Exception(f"Cloudinary upload failed: {e}")
    
    def delete_file(self, file_id: str, user_id: str) -> bool:
        if not self.available:
            return False
        
        try:
            public_id = f"infinityhole/users/{user_id}/{file_id}"
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception as e:
            print(f"Cloudinary delete failed: {e}")
            return False
    
    def get_file_info(self, file_id: str, user_id: str) -> Optional[Dict]:
        if not self.available:
            return None
        
        try:
            public_id = f"infinityhole/users/{user_id}/{file_id}"
            result = cloudinary.api.resource(public_id)
            
            return {
                "id": file_id,
                "name": file_id.split("_", 1)[1] if "_" in file_id else file_id,
                "size": result["bytes"],
                "content_type": result["resource_type"],
                "created": result["created_at"],
                "download_url": result["secure_url"]
            }
        except Exception as e:
            print(f"Cloudinary get file info failed: {e}")
            return None
    
    def list_files(self, user_id: str) -> List[Dict]:
        if not self.available:
            return []
        
        try:
            prefix = f"infinityhole/users/{user_id}/"
            result = cloudinary.api.resources(
                type="upload",
                prefix=prefix,
                max_results=100
            )
            
            files = []
            for resource in result["resources"]:
                file_id = resource["public_id"].split("/")[-1]
                files.append({
                    "id": file_id,
                    "name": file_id.split("_", 1)[1] if "_" in file_id else file_id,
                    "size": resource["bytes"],
                    "content_type": resource["resource_type"],
                    "created": resource["created_at"],
                    "download_url": resource["secure_url"]
                })
            
            return files
        except Exception as e:
            print(f"Cloudinary list files failed: {e}")
            return []
    
    def get_quota_usage(self, user_id: str) -> Tuple[float, float]:
        if not self.available:
            return 0.0, 0.0
        
        try:
            files = self.list_files(user_id)
            total_size = sum(file["size"] for file in files)
            usage_mb = total_size / (1024 * 1024)
            return usage_mb, self.quota_limit_mb
        except Exception as e:
            print(f"Cloudinary quota check failed: {e}")
            return 0.0, 0.0
    
    def is_available(self) -> bool:
        return self.available

class LocalStorageProvider(StorageProvider):
    """Local file system implementation"""
    
    def __init__(self):
        self.base_path = "cloud_storage"
        self.quota_limit_mb = 1000  # 1GB local storage
        self.available = True
        
        # Create base directory
        os.makedirs(self.base_path, exist_ok=True)
    
    def upload_file(self, file_content: bytes, filename: str, user_id: str) -> Tuple[str, str]:
        try:
            # Create user directory
            user_dir = os.path.join(self.base_path, user_id)
            os.makedirs(user_dir, exist_ok=True)
            
            # Create unique filename
            timestamp = int(time.time())
            file_id = f"{timestamp}_{filename}"
            file_path = os.path.join(user_dir, file_id)
            
            # Write file
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # Return local URL (in production, this would be served by your web server)
            download_url = f"/cloud_storage/{user_id}/{file_id}"
            return download_url, file_id
        except Exception as e:
            raise Exception(f"Local storage upload failed: {e}")
    
    def delete_file(self, file_id: str, user_id: str) -> bool:
        try:
            file_path = os.path.join(self.base_path, user_id, file_id)
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Local storage delete failed: {e}")
            return False
    
    def get_file_info(self, file_id: str, user_id: str) -> Optional[Dict]:
        try:
            file_path = os.path.join(self.base_path, user_id, file_id)
            if not os.path.exists(file_path):
                return None
            
            stat = os.stat(file_path)
            return {
                "id": file_id,
                "name": file_id.split("_", 1)[1] if "_" in file_id else file_id,
                "size": stat.st_size,
                "content_type": "application/octet-stream",
                "created": time.ctime(stat.st_ctime),
                "download_url": f"/cloud_storage/{user_id}/{file_id}"
            }
        except Exception as e:
            print(f"Local storage get file info failed: {e}")
            return None
    
    def list_files(self, user_id: str) -> List[Dict]:
        try:
            user_dir = os.path.join(self.base_path, user_id)
            if not os.path.exists(user_dir):
                return []
            
            files = []
            for filename in os.listdir(user_dir):
                file_path = os.path.join(user_dir, filename)
                if os.path.isfile(file_path):
                    stat = os.stat(file_path)
                    files.append({
                        "id": filename,
                        "name": filename.split("_", 1)[1] if "_" in filename else filename,
                        "size": stat.st_size,
                        "content_type": "application/octet-stream",
                        "created": time.ctime(stat.st_ctime),
                        "download_url": f"/cloud_storage/{user_id}/{filename}"
                    })
            
            return files
        except Exception as e:
            print(f"Local storage list files failed: {e}")
            return []
    
    def get_quota_usage(self, user_id: str) -> Tuple[float, float]:
        try:
            files = self.list_files(user_id)
            total_size = sum(file["size"] for file in files)
            usage_mb = total_size / (1024 * 1024)
            return usage_mb, self.quota_limit_mb
        except Exception as e:
            print(f"Local storage quota check failed: {e}")
            return 0.0, 0.0
    
    def is_available(self) -> bool:
        return self.available

class MultiStorageManager:
    """Manages multiple storage providers with automatic failover"""
    
    def __init__(self):
        # Initialize storage providers in priority order
        self.providers = []
        
        # Try to initialize Cloudinary FIRST (primary storage)
        try:
            cloudinary_provider = CloudinaryStorageProvider()
            if cloudinary_provider.is_available():
                self.providers.append(cloudinary_provider)
                print("✅ Cloudinary Storage initialized successfully (PRIMARY)")
            else:
                print("⚠️ Cloudinary Storage not available - using fallback")
        except Exception as e:
            print(f"⚠️ Cloudinary Storage initialization failed: {e}")
        
        # Try to initialize Firebase Storage (secondary)
        try:
            firebase_provider = FirebaseStorageProvider()
            if firebase_provider.is_available():
                self.providers.append(firebase_provider)
                print("✅ Firebase Storage initialized successfully (SECONDARY)")
            else:
                print("⚠️ Firebase Storage not available - using fallback")
        except Exception as e:
            print(f"⚠️ Firebase Storage initialization failed: {e}")
        
        # Always add Local Storage as fallback
        local_provider = LocalStorageProvider()
        self.providers.append(local_provider)
        print("✅ Local Storage initialized as fallback")
        
        print(f"🎯 Total storage providers available: {len(self.providers)}")
        
        # Load user storage preferences
        self.user_storage_file = "user_storage_preferences.json"
        self.user_preferences = self._load_user_preferences()
    
    def _load_user_preferences(self) -> Dict:
        """Load user storage preferences from file"""
        try:
            if os.path.exists(self.user_storage_file):
                with open(self.user_storage_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading user preferences: {e}")
        return {}
    
    def _save_user_preferences(self):
        """Save user storage preferences to file"""
        try:
            with open(self.user_storage_file, 'w') as f:
                json.dump(self.user_preferences, f, indent=2)
        except Exception as e:
            print(f"Error saving user preferences: {e}")
    
    def _get_user_storage_info(self, user_id: str) -> Dict:
        """Get or create user storage information"""
        if user_id not in self.user_preferences:
            self.user_preferences[user_id] = {
                "current_provider": 0,  # Index of current provider
                "ads_watched": 0,
                "storage_used": 0.0,
                "files": []
            }
            self._save_user_preferences()
        return self.user_preferences[user_id]
    
    def _find_available_provider(self, user_id: str, file_size_mb: float) -> Optional[int]:
        """Find an available storage provider for the user"""
        user_info = self._get_user_storage_info(user_id)
        current_provider_idx = user_info.get("current_provider", 0)
        
        # Check current provider first
        if current_provider_idx < len(self.providers):
            provider = self.providers[current_provider_idx]
            if provider.is_available():
                usage_mb, limit_mb = provider.get_quota_usage(user_id)
                if usage_mb + file_size_mb <= limit_mb:
                    return current_provider_idx
        
        # Check other providers
        for i, provider in enumerate(self.providers):
            if i != current_provider_idx and provider.is_available():
                usage_mb, limit_mb = provider.get_quota_usage(user_id)
                if usage_mb + file_size_mb <= limit_mb:
                    # Switch to this provider
                    user_info["current_provider"] = i
                    self._save_user_preferences()
                    return i
        
        return None
    
    def upload_file(self, file_content: bytes, filename: str, user_id: str) -> Tuple[str, str, str]:
        """Upload file using available storage provider"""
        file_size_mb = len(file_content) / (1024 * 1024)
        
        # Find available provider
        provider_idx = self._find_available_provider(user_id, file_size_mb)
        if provider_idx is None:
            raise Exception("No storage providers available or quota exceeded")
        
        provider = self.providers[provider_idx]
        provider_name = provider.__class__.__name__.replace("StorageProvider", "")
        
        try:
            download_url, file_id = provider.upload_file(file_content, filename, user_id)
            
            # Update user storage info
            user_info = self._get_user_storage_info(user_id)
            user_info["storage_used"] += file_size_mb
            user_info["files"].append({
                "id": file_id,
                "name": filename,
                "size": len(file_content),
                "provider": provider_name,
                "uploaded_at": time.time()
            })
            self._save_user_preferences()
            
            return download_url, file_id, provider_name
        except Exception as e:
            raise Exception(f"Upload failed with {provider_name}: {e}")
    
    def delete_file(self, file_id: str, user_id: str) -> bool:
        """Delete file from storage"""
        user_info = self._get_user_storage_info(user_id)
        
        # Find the file in user's file list
        file_info = None
        for file_data in user_info["files"]:
            if file_data["id"] == file_id:
                file_info = file_data
                break
        
        if not file_info:
            return False
        
        provider_name = file_info["provider"]
        
        # Find the provider
        provider = None
        for p in self.providers:
            if p.__class__.__name__.replace("StorageProvider", "") == provider_name:
                provider = p
                break
        
        if not provider:
            return False
        
        try:
            success = provider.delete_file(file_id, user_id)
            if success:
                # Update user storage info
                user_info["storage_used"] -= file_info["size"] / (1024 * 1024)
                user_info["files"] = [f for f in user_info["files"] if f["id"] != file_id]
                self._save_user_preferences()
            return success
        except Exception as e:
            print(f"Delete failed: {e}")
            return False
    
    def list_files(self, user_id: str) -> List[Dict]:
        """List all files for a user across all providers"""
        user_info = self._get_user_storage_info(user_id)
        current_provider_idx = user_info.get("current_provider", 0)
        
        # Try to get files from the current provider
        if current_provider_idx < len(self.providers):
            current_provider = self.providers[current_provider_idx]
            if current_provider.is_available():
                try:
                    files = current_provider.list_files(user_id)
                    # Update user info with current files
                    user_info["files"] = files
                    self._save_user_preferences()
                    return files
                except Exception as e:
                    print(f"Failed to list files from current provider: {e}")
        
        # Fallback to stored files
        return user_info.get("files", [])
    
    def get_storage_info(self, user_id: str) -> Dict:
        """Get comprehensive storage information for a user"""
        user_info = self._get_user_storage_info(user_id)
        current_provider_idx = user_info.get("current_provider", 0)
        
        if current_provider_idx < len(self.providers):
            current_provider = self.providers[current_provider_idx]
            if current_provider.is_available():
                usage_mb, limit_mb = current_provider.get_quota_usage(user_id)
                provider_name = current_provider.__class__.__name__.replace("StorageProvider", "")
                
                return {
                    "current_provider": provider_name,
                    "usage_mb": usage_mb,
                    "limit_mb": limit_mb,
                    "ads_watched": user_info.get("ads_watched", 0),
                    "available_providers": [p.__class__.__name__.replace("StorageProvider", "") 
                                          for p in self.providers if p.is_available()]
                }
        
        return {
            "current_provider": "None",
            "usage_mb": 0.0,
            "limit_mb": 0.0,
            "ads_watched": user_info.get("ads_watched", 0),
            "available_providers": []
        }
    
    def watch_ad(self, user_id: str) -> Dict:
        """User watched an ad, increase storage quota"""
        user_info = self._get_user_storage_info(user_id)
        user_info["ads_watched"] = user_info.get("ads_watched", 0) + 1
        
        # Increase quota for current provider
        current_provider_idx = user_info.get("current_provider", 0)
        if current_provider_idx < len(self.providers):
            provider = self.providers[current_provider_idx]
            if hasattr(provider, 'quota_limit_mb'):
                provider.quota_limit_mb += 10  # Add 10MB per ad
        
        self._save_user_preferences()
        
        return {
            "ads_watched": user_info["ads_watched"],
            "bonus_storage_mb": 10,
            "message": "Thanks for watching! You earned 10MB of extra storage."
        }

# Global storage manager instance
storage_manager = MultiStorageManager()
