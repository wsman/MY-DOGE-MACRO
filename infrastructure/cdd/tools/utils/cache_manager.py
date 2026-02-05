"""
通用文件哈希与缓存管理器
"""
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

class CacheManager:
    """通用缓存管理器 (原 EntropyCache)"""
    
    CACHE_VERSION = "1.0"
    CACHE_FILE = ".entropy_cache.json"
    
    def __init__(self, project_path: Path, cache_file_name: str = ".entropy_cache.json"):
        self.project_path = project_path
        self.cache_file = project_path / cache_file_name
        self.cache = self._load_cache()
    
    def _load_cache(self) -> dict:
        """加载缓存文件"""
        if not self.cache_file.exists():
            return self._create_empty_cache()
        
        try:
            with open(self.cache_file, 'r') as f:
                cache = json.load(f)
                if cache.get("version") != self.CACHE_VERSION:
                    return self._create_empty_cache()
                return cache
        except (json.JSONDecodeError, IOError):
            return self._create_empty_cache()
    
    def _create_empty_cache(self) -> dict:
        return {
            "version": self.CACHE_VERSION,
            "last_updated": None,
            "file_hashes": {},
            "metrics_cache": {}
        }
    
    def _save_cache(self):
        self.cache["last_updated"] = datetime.now().isoformat()
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.cache, f, indent=2)
        except IOError:
            pass
    
    def calculate_file_hash(self, file_path: Union[str, Path]) -> str:
        file_path = Path(file_path)
        if not file_path.exists():
            return ""
        
        sha256 = hashlib.sha256()
        try:
            with open(file_path, 'rb') as f:
                while chunk := f.read(8192):
                    sha256.update(chunk)
            return sha256.hexdigest()
        except IOError:
            return ""
    
    def calculate_dir_hash(self, dir_path: Union[str, Path], pattern: str = "**/*") -> str:
        dir_path = Path(dir_path)
        if not dir_path.exists() or not dir_path.is_dir():
            return ""
        
        file_hashes = []
        for file_path in sorted(dir_path.rglob(pattern)):
            if file_path.is_file():
                file_hash = self.calculate_file_hash(file_path)
                if file_hash:
                    file_hashes.append(f"{file_path.relative_to(dir_path)}:{file_hash}")
        
        if not file_hashes:
            return ""
        
        sha256 = hashlib.sha256()
        sha256.update('\n'.join(file_hashes).encode('utf-8'))
        return sha256.hexdigest()
    
    def get_file_hash(self, file_path: Union[str, Path], refresh: bool = False) -> str:
        file_path_obj = Path(file_path)
        
        # 计算文件键
        try:
            # 尝试转换为相对于项目路径的相对路径
            if file_path_obj.is_absolute():
                try:
                    file_key = str(file_path_obj.relative_to(self.project_path))
                except ValueError:
                    # 如果路径不在项目目录内，使用绝对路径作为键
                    file_key = str(file_path_obj)
            else:
                # 相对路径直接使用
                file_key = str(file_path_obj)
        except Exception:
            # 其他异常情况，使用字符串表示
            file_key = str(file_path_obj)

        if refresh or file_key not in self.cache["file_hashes"]:
            if Path(file_path).is_dir():
                file_hash = self.calculate_dir_hash(file_path)
            else:
                file_hash = self.calculate_file_hash(file_path)
            
            self.cache["file_hashes"][file_key] = file_hash
            self._save_cache()
        
        return self.cache["file_hashes"].get(file_key, "")
    
    def get_cached_metric(self, metric_name: str, dependencies: List[str], force_recalculate: bool = False) -> Tuple[Optional[float], bool]:
        if force_recalculate or metric_name not in self.cache["metrics_cache"]:
            return None, True
        
        cache_entry = self.cache["metrics_cache"][metric_name]
        
        for dep in dependencies:
            current_hash = self.get_file_hash(dep)
            cached_hash = cache_entry.get("hash_deps", {}).get(str(dep))
            if current_hash != cached_hash:
                return None, True
        
        cached_time_str = cache_entry.get("timestamp")
        if cached_time_str:
            try:
                cached_time = datetime.fromisoformat(cached_time_str)
                if (datetime.now() - cached_time).total_seconds() > 24 * 3600:
                    return None, True
            except (ValueError, TypeError):
                pass
        
        return cache_entry.get("value"), False
    
    def set_cached_metric(self, metric_name: str, value: float, dependencies: List[str]):
        hash_deps = {}
        for dep in dependencies:
            hash_deps[str(dep)] = self.get_file_hash(dep)
        
        self.cache["metrics_cache"][metric_name] = {
            "value": value,
            "hash_deps": hash_deps,
            "timestamp": datetime.now().isoformat()
        }
        self._save_cache()
    
    def clear_cache(self):
        self.cache = self._create_empty_cache()
        if self.cache_file.exists():
            self.cache_file.unlink()
    
    def get_cache_info(self) -> dict:
        return {
            "cache_file": str(self.cache_file),
            "cache_size": len(self.cache.get("metrics_cache", {})),
            "last_updated": self.cache.get("last_updated"),
            "version": self.cache.get("version")
        }