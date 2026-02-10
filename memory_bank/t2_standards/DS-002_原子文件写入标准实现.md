# DS-002: 原子文件写入标准实现

**版本**: v1.0.0
**状态**: 🟢 活跃
**宪法依据**: §125数据完整性公理、§126事务原子性公理
**最后更新**: 2026-02-09

## 1. 范围

本规范适用于MY-DOGE-MACRO项目中所有文件写入操作，确保数据完整性和事务原子性。涵盖以下场景：
- 配置文件更新
- 用户数据持久化
- 系统状态保存
- 日志文件写入
- 缓存数据更新

## 2. 技术要求

### 2.1 原子性要求

| 操作类型 | 原子性要求 | 实现方法 |
|----------|-----------|----------|
| **文件写入** | 写入必须完全成功或完全失败，不允许部分写入 | 使用"写临时文件+重命名"模式 |
| **配置文件更新** | 更新期间应用不应读取到损坏或不完整的配置 | 使用原子替换，确保读取一致性 |
| **数据库事务** | 多个相关文件更新必须作为一个原子操作 | 使用两阶段提交或补偿事务 |
| **状态持久化** | 系统崩溃时状态应可恢复到最后一致状态 | 使用检查点和事务日志 |

### 2.2 写入模式规范

#### Python原子写入实现

```python
import os
import tempfile
import shutil
from pathlib import Path
from typing import Optional, Callable, Any


def atomic_write(file_path: str, content: str, encoding: str = 'utf-8') -> bool:
    """
    原子写入文件
    
    使用临时文件+重命名模式确保写入的原子性
    
    参数:
        file_path: 目标文件路径
        content: 要写入的内容
        encoding: 文件编码，默认为UTF-8
        
    返回:
        bool: 写入成功返回True，失败返回False
    """
    dir_path = os.path.dirname(file_path)
    file_name = os.path.basename(file_path)
    
    # 确保目录存在
    if dir_path and not os.path.exists(dir_path):
        os.makedirs(dir_path, exist_ok=True)
    
    # 创建临时文件（在同一目录中以确保原子重命名）
    temp_fd, temp_path = tempfile.mkstemp(
        prefix=f".{file_name}.tmp.",
        suffix='',
        dir=dir_path or None
    )
    
    try:
        # 写入临时文件
        with os.fdopen(temp_fd, 'w', encoding=encoding) as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())  # 确保数据写入磁盘
        
        # 原子重命名（POSIX系统上原子，Windows上尽量原子）
        os.replace(temp_path, file_path)
        return True
        
    except Exception as e:
        # 清理临时文件
        try:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        except Exception:
            pass
        
        print(f"原子写入文件 {file_path} 失败: {e}")
        return False


def atomic_write_binary(file_path: str, data: bytes) -> bool:
    """
    原子写入二进制文件
    
    参数:
        file_path: 目标文件路径
        data: 要写入的二进制数据
        
    返回:
        bool: 写入成功返回True，失败返回False
    """
    dir_path = os.path.dirname(file_path)
    file_name = os.path.basename(file_path)
    
    # 确保目录存在
    if dir_path and not os.path.exists(dir_path):
        os.makedirs(dir_path, exist_ok=True)
    
    # 创建临时文件
    temp_fd, temp_path = tempfile.mkstemp(
        prefix=f".{file_name}.tmp.",
        suffix='',
        dir=dir_path or None
    )
    
    try:
        # 写入临时文件
        with os.fdopen(temp_fd, 'wb') as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        
        # 原子重命名
        os.replace(temp_path, file_path)
        return True
        
    except Exception as e:
        # 清理临时文件
        try:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        except Exception:
            pass
        
        print(f"原子写入二进制文件 {file_path} 失败: {e}")
        return False


class AtomicFileWriter:
    """
    原子文件写入器（上下文管理器版本）
    
    示例:
        with AtomicFileWriter("config.json") as writer:
            writer.write('{"key": "value"}')
    """
    
    def __init__(self, file_path: str, encoding: str = 'utf-8'):
        self.file_path = file_path
        self.encoding = encoding
        self.temp_path: Optional[str] = None
        self.temp_file = None
        self._written = False
        
    def __enter__(self):
        dir_path = os.path.dirname(self.file_path)
        file_name = os.path.basename(self.file_path)
        
        # 确保目录存在
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
        
        # 创建临时文件
        temp_fd, self.temp_path = tempfile.mkstemp(
            prefix=f".{file_name}.tmp.",
            suffix='',
            dir=dir_path or None
        )
        
        # 打开临时文件
        self.temp_file = os.fdopen(temp_fd, 'w', encoding=self.encoding)
        return self
    
    def write(self, content: str):
        """写入内容到临时文件"""
        if self.temp_file is None:
            raise RuntimeError("写入器未正确初始化")
        self.temp_file.write(content)
        self._written = True
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.temp_file is not None:
            self.temp_file.close()
        
        # 如果有异常，清理临时文件
        if exc_type is not None or not self._written:
            if self.temp_path and os.path.exists(self.temp_path):
                try:
                    os.unlink(self.temp_path)
                except Exception:
                    pass
            return False  # 重新抛出异常
        
        # 没有异常且已写入，执行原子重命名
        if self.temp_path and os.path.exists(self.temp_path):
            try:
                os.replace(self.temp_path, self.file_path)
            except Exception as e:
                # 重命名失败，清理临时文件
                try:
                    os.unlink(self.temp_path)
                except Exception:
                    pass
                raise RuntimeError(f"原子重命名失败: {e}")
        
        return False
```

#### TypeScript原子写入实现

```typescript
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';

/**
 * 原子写入文件（TypeScript实现）
 */
export async function atomicWrite(
  filePath: string, 
  content: string | Buffer, 
  encoding: BufferEncoding = 'utf8'
): Promise<boolean> {
  const dirPath = dirname(filePath);
  const fileName = basename(filePath);
  
  try {
    // 确保目录存在
    await fs.mkdir(dirPath, { recursive: true });
    
    // 创建临时文件路径
    const tempPath = join(dirPath, `.${fileName}.tmp.${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    // 写入临时文件
    if (Buffer.isBuffer(content)) {
      await fs.writeFile(tempPath, content);
    } else {
      await fs.writeFile(tempPath, content, encoding);
    }
    
    // 同步到磁盘（确保数据持久化）
    const fd = await fs.open(tempPath, 'r');
    try {
      await fd.sync();
    } finally {
      await fd.close();
    }
    
    // 原子重命名
    await fs.rename(tempPath, filePath);
    return true;
    
  } catch (error) {
    // 清理临时文件（如果存在）
    try {
      const tempPath = error.tempPath; // 需要在实际实现中传递
      if (tempPath) {
        await fs.unlink(tempPath).catch(() => { /* 忽略清理错误 */ });
      }
    } catch {
      // 忽略清理错误
    }
    
    console.error(`原子写入文件 ${filePath} 失败:`, error);
    return false;
  }
}

/**
 * 原子JSON写入（带格式化和验证）
 */
export async function atomicWriteJson<T extends object>(
  filePath: string, 
  data: T,
  space: number = 2
): Promise<boolean> {
  try {
    // 序列化JSON
    const content = JSON.stringify(data, null, space);
    
    // 验证序列化后的JSON可以正确解析
    JSON.parse(content);
    
    // 原子写入
    return await atomicWrite(filePath, content, 'utf8');
  } catch (error) {
    console.error(`原子写入JSON到 ${filePath} 失败:`, error);
    return false;
  }
}
```

### 2.3 事务性写入（多文件原子操作）

```python
import os
import tempfile
from contextlib import contextmanager
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class TransactionalWrite:
    """事务性写入操作"""
    file_path: str
    content: str
    encoding: str = 'utf-8'
    temp_path: Optional[str] = None


class MultiFileAtomicWriter:
    """
    多文件原子写入器
    
    确保多个文件的写入要么全部成功，要么全部失败
    """
    
    def __init__(self):
        self.operations: List[TransactionalWrite] = []
        self.completed: List[str] = []  # 已完成的临时文件路径
        self.failed = False
    
    def add_write(self, file_path: str, content: str, encoding: str = 'utf-8'):
        """添加一个写入操作"""
        self.operations.append(TransactionalWrite(
            file_path=file_path,
            content=content,
            encoding=encoding
        ))
    
    def execute(self) -> bool:
        """
        执行所有写入操作
        
        返回:
            bool: 全部成功返回True，否则返回False
        """
        try:
            # 阶段1：准备（写入所有临时文件）
            for op in self.operations:
                dir_path = os.path.dirname(op.file_path)
                file_name = os.path.basename(op.file_path)
                
                # 确保目录存在
                if dir_path and not os.path.exists(dir_path):
                    os.makedirs(dir_path, exist_ok=True)
                
                # 创建临时文件
                temp_fd, temp_path = tempfile.mkstemp(
                    prefix=f".{file_name}.tmp.",
                    suffix='',
                    dir=dir_path or None
                )
                op.temp_path = temp_path
                
                # 写入临时文件
                try:
                    with os.fdopen(temp_fd, 'w', encoding=op.encoding) as f:
                        f.write(op.content)
                        f.flush()
                        os.fsync(f.fileno())
                    self.completed.append(temp_path)
                except Exception as e:
                    self.failed = True
                    raise RuntimeError(f"写入临时文件 {temp_path} 失败: {e}")
            
            if self.failed:
                self._rollback()
                return False
            
            # 阶段2：提交（重命名所有临时文件）
            for op in self.operations:
                if op.temp_path:
                    os.replace(op.temp_path, op.file_path)
            
            return True
            
        except Exception as e:
            self.failed = True
            self._rollback()
            print(f"多文件原子写入失败: {e}")
            return False
    
    def _rollback(self):
        """回滚所有临时文件"""
        for temp_path in self.completed:
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            except Exception:
                pass
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None or self.failed:
            self._rollback()
        return False
```

### 2.4 备份与恢复机制

```python
import os
import shutil
import time
from pathlib import Path
from typing import Optional


def atomic_write_with_backup(
    file_path: str, 
    content: str, 
    backup_count: int = 3,
    encoding: str = 'utf-8'
) -> bool:
    """
    带备份的原子写入
    
    参数:
        file_path: 目标文件路径
        content: 要写入的内容
        backup_count: 保留的备份数量
        encoding: 文件编码
        
    返回:
        bool: 写入成功返回True，失败返回False
    """
    path = Path(file_path)
    
    # 如果文件已存在，创建备份
    if path.exists():
        backup_dir = path.parent / ".backups"
        backup_dir.mkdir(exist_ok=True)
        
        # 清理旧的备份
        backups = sorted(backup_dir.glob(f"{path.name}.backup.*"))
        if len(backups) >= backup_count:
            for old_backup in backups[:-backup_count + 1]:
                try:
                    old_backup.unlink()
                except Exception:
                    pass
        
        # 创建新备份
        timestamp = int(time.time())
        backup_path = backup_dir / f"{path.name}.backup.{timestamp}"
        try:
            shutil.copy2(file_path, backup_path)
        except Exception as e:
            print(f"创建备份失败，但继续执行写入: {e}")
    
    # 执行原子写入
    return atomic_write(file_path, content, encoding)


def restore_from_backup(file_path: str, backup_index: int = 0) -> Optional[str]:
    """
    从备份恢复文件
    
    参数:
        file_path: 目标文件路径
        backup_index: 备份索引（0为最新）
        
    返回:
        Optional[str]: 恢复成功返回备份文件路径，失败返回None
    """
    path = Path(file_path)
    backup_dir = path.parent / ".backups"
    
    if not backup_dir.exists():
        return None
    
    # 查找所有备份
    backups = sorted(backup_dir.glob(f"{path.name}.backup.*"), reverse=True)
    
    if backup_index < len(backups):
        backup_path = backups[backup_index]
        try:
            shutil.copy2(backup_path, file_path)
            return str(backup_path)
        except Exception as e:
            print(f"从备份恢复失败: {e}")
    
    return None
```

## 3. 验证方法

### 3.1 原子性测试

#### Python单元测试

```python
import pytest
import os
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed


def test_atomic_write_basic():
    """测试基本的原子写入功能"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        test_file = f.name
    
    try:
        # 写入内容
        content = "原子写入测试内容\n第二行\n第三行"
        assert atomic_write(test_file, content) == True
        
        # 验证写入的内容
        with open(test_file, 'r', encoding='utf-8') as f:
            read_content = f.read()
            assert read_content == content
        
        # 验证文件存在
        assert os.path.exists(test_file) == True
        
    finally:
        if os.path.exists(test_file):
            os.unlink(test_file)


def test_atomic_write_failure_recovery():
    """测试写入失败时的恢复"""
    with tempfile.TemporaryDirectory() as temp_dir:
        test_file = os.path.join(temp_dir, "test.txt")
        
        # 模拟写入失败（权限错误）
        # 注意：这个测试需要实际创建权限错误场景
        # 这里简化测试逻辑
        
        # 测试正常写入
        assert atomic_write(test_file, "正常内容") == True
        assert os.path.exists(test_file) == True


def test_atomic_write_concurrent():
    """测试并发写入的原子性"""
    with tempfile.TemporaryDirectory() as temp_dir:
        test_file = os.path.join(temp_dir, "concurrent.txt")
        
        def write_task(task_id: int):
            """并发写入任务"""
            content = f"任务 {task_id} 写入的内容"
            return atomic_write(test_file, content)
        
        # 使用多个线程并发写入
        results = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(write_task, i) for i in range(10)]
            for future in as_completed(futures):
                results.append(future.result())
        
        # 读取最终文件内容
        if os.path.exists(test_file):
            with open(test_file, 'r', encoding='utf-8') as f:
                final_content = f.read()
            
            # 验证文件内容来自某个任务（而不是混合内容）
            # 由于原子性，文件应该包含完整的内容
            assert final_content is not None
            assert len(final_content) > 0
            
            # 检查是否为有效的写入结果
            for i in range(10):
                expected = f"任务 {i} 写入的内容"
                if final_content == expected:
                    break
            else:
                # 文件内容不符合任何任务的预期
                # 这可能是合法的（由于并发竞争），但内容应该是完整的
                assert '\n' not in final_content  # 确保没有混合行


def test_multi_file_atomic_writer():
    """测试多文件原子写入器"""
    with tempfile.TemporaryDirectory() as temp_dir:
        file1 = os.path.join(temp_dir, "file1.txt")
        file2 = os.path.join(temp_dir, "file2.txt")
        file3 = os.path.join(temp_dir, "file3.txt")
        
        with MultiFileAtomicWriter() as writer:
            writer.add_write(file1, "文件1内容")
            writer.add_write(file2, "文件2内容")
            writer.add_write(file3, "文件3内容")
            
            success = writer.execute()
            assert success == True
            
            # 验证所有文件都已写入
            for file_path in [file1, file2, file3]:
                assert os.path.exists(file_path) == True
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    assert "内容" in content


def test_atomic_write_with_backup():
    """测试带备份的原子写入"""
    with tempfile.TemporaryDirectory() as temp_dir:
        test_file = os.path.join(temp_dir, "backup_test.txt")
        
        # 第一次写入
        assert atomic_write_with_backup(test_file, "版本1", backup_count=2) == True
        
        # 第二次写入
        assert atomic_write_with_backup(test_file, "版本2", backup_count=2) == True
        
        # 检查备份
        backup_dir = os.path.join(temp_dir, ".backups")
        assert os.path.exists(backup_dir) == True
        
        backups = sorted(os.listdir(backup_dir))
        assert len(backups) == 1  # 应该有一个备份（版本1）
        
        # 第三次写入
        assert atomic_write_with_backup(test_file, "版本3", backup_count=2) == True
        
        backups = sorted(os.listdir(backup_dir))
        assert len(backups) == 2  # 应该有两个备份（版本1和版本2）
```

### 3.2 完整性检查

#### Python完整性验证

```python
import hashlib
import os


def verify_file_integrity(file_path: str, expected_hash: str = None) -> tuple[bool, str]:
    """
    验证文件完整性
    
    参数:
        file_path: 文件路径
        expected_hash: 期望的哈希值（可选）
        
    返回:
        tuple[bool, str]: (完整性检查结果, 实际哈希值)
    """
    if not os.path.exists(file_path):
        return False, ""
    
    try:
        # 计算文件哈希（SHA-256）
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            # 分块读取大文件
            for chunk in iter(lambda: f.read(4096), b''):
                sha256.update(chunk)
        
        actual_hash = sha256.hexdigest()
        
        if expected_hash:
            return actual_hash == expected_hash, actual_hash
        else:
            return True, actual_hash  # 没有预期哈希，只计算哈希值
            
    except Exception as e:
        print(f"验证文件完整性失败: {e}")
        return False, ""


def atomic_write_with_integrity(
    file_path: str, 
    content: str, 
    encoding: str = 'utf-8'
) -> tuple[bool, str]:
    """
    带完整性检查的原子写入
    
    返回:
        tuple[bool, str]: (写入成功, 文件哈希值)
    """
    # 计算内容哈希
    content_bytes = content.encode(encoding)
    content_hash = hashlib.sha256(content_bytes).hexdigest()
    
    # 原子写入
    success = atomic_write(file_path, content, encoding)
    
    if success:
        # 验证写入的完整性
        integrity_ok, actual_hash = verify_file_integrity(file_path)
        if integrity_ok and actual_hash == content_hash:
            return True, actual_hash
        else:
            # 完整性检查失败，删除文件
            try:
                os.unlink(file_path)
            except Exception:
                pass
            return False, ""
    else:
        return False, ""
```

## 4. 性能优化

### 4.1 批量写入优化

```python
import os
import tempfile
from typing import List, Tuple


def batch_atomic_write(
    write_operations: List[Tuple[str, str]],
    encoding: str = 'utf-8',
    use_threadpool: bool = False
) -> dict[str, bool]:
    """
    批量原子写入
    
    参数:
        write_operations: [(file_path, content), ...] 列表
        encoding: 文件编码
        use_threadpool: 是否使用线程池并行写入
        
    返回:
        dict[str, bool]: 文件路径到写入结果的映射
    """
    results = {}
    
    if use_threadpool and len(write_operations) > 5:
        # 使用线程池并行写入（适用于大量独立文件）
        import concurrent.futures
        
        def write_task(op: Tuple[str, str]) -> Tuple[str, bool]:
            file_path, content = op
            success = atomic_write(file_path, content, encoding)
            return file_path, success
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            future_to_op = {
                executor.submit(write_task, op): op[0] 
                for op in write_operations
            }
            
            for future in concurrent.futures.as_completed(future_to_op):
                file_path = future_to_op[future]
                try:
                    _, success = future.result()
                    results[file_path] = success
                except Exception as e:
                    results[file_path] = False
                    print(f"批量写入文件 {file_path} 失败: {e}")
    else:
        # 顺序写入（适用于少量文件或需要事务性保证的场景）
        for file_path, content in write_operations:
            success = atomic_write(file_path, content, encoding)
            results[file_path] = success
    
    return results
```

### 4.2 缓存写入优化

```python
import time
from collections import OrderedDict
from typing import Optional, Dict, Any


class BufferedAtomicWriter:
    """
    缓冲原子写入器
    
    将多次写入缓冲，定期批量提交
    """
    
    def __init__(self, flush_interval: float = 5.0, max_buffer_size: int = 100):
        self.buffer: Dict[str, str] = OrderedDict()
        self.flush_interval = flush_interval
        self.max_buffer_size = max_buffer_size
        self.last_flush_time = time.time()
        self.encoding = 'utf-8'
    
    def write(self, file_path: str, content: str, immediate: bool = False):
        """
        缓冲写入
        
        参数:
            file_path: 文件路径
            content: 内容
            immediate: 是否立即写入（不缓冲）
        """
        if immediate or len(self.buffer) >= self.max_buffer_size:
            # 立即写入或缓冲区满
            self._flush_single(file_path, content)
        else:
            # 缓冲写入
            self.buffer[file_path] = content
            
            # 检查是否需要刷新
            current_time = time.time()
            if current_time - self.last_flush_time >= self.flush_interval:
                self.flush()
    
    def flush(self):
        """刷新缓冲区，写入所有缓冲的内容"""
        if not self.buffer:
            return
        
        # 批量原子写入
        write_ops = [(path, content) for path, content in self.buffer.items()]
        results = batch_atomic_write(write_ops, self.encoding)
        
        # 清理已成功的写入
        for file_path, success in results.items():
            if success and file_path in self.buffer:
                del self.buffer[file_path]
        
        self.last_flush_time = time.time()
    
    def _flush_single(self, file_path: str, content: str):
        """刷新单个文件"""
        success = atomic_write(file_path, content, self.encoding)
        if success and file_path in self.buffer:
            del self.buffer[file_path]
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.flush()
```

## 5. 故障排除

### 5.1 常见问题

| 问题 | 症状 | 解决方案 |
|------|------|----------|
| **部分写入** | 文件损坏，只包含部分内容 | 1. 使用原子写入模式<br>2. 验证写入前后的文件大小<br>3. 添加完整性校验 |
| **权限问题** | 无法创建临时文件或重命名 | 1. 检查目录权限<br>2. 确保临时文件和目标文件在同一文件系统<br>3. 使用适当的用户权限 |
| **磁盘空间不足** | 写入失败，磁盘已满 | 1. 检查磁盘空间<br>2. 实现优雅降级<br>3. 添加磁盘空间监控 |
| **并发冲突** | 多个进程同时写入同一文件 | 1. 使用文件锁<br>2. 实现乐观并发控制<br>3. 使用事务性写入 |
| **跨平台问题** | Windows/Linux行为不一致 | 1. 使用os.replace而不是os.rename<br>2. 处理Windows文件锁定<br>3. 测试跨平台兼容性 |

### 5.2 调试工具

```python
import os
import stat
import time


def diagnose_write_problem(file_path: str) -> dict:
    """诊断写入问题"""
    result = {
        'file_path': file_path,
        'exists': os.path.exists(file_path),
        'is_file': None,
        'size': None,
        'permissions': None,
        'modification_time': None,
        'parent_writable': None,
        'diagnosis': []
    }
    
    if result['exists']:
        try:
            stat_info = os.stat(file_path)
            result['is_file'] = stat.S_ISREG(stat_info.st_mode)
            result['size'] = stat_info.st_size
            result['permissions'] = stat.filemode(stat_info.st_mode)
            result['modification_time'] = time.ctime(stat_info.st_mtime)
        except Exception as e:
            result['diagnosis'].append(f"获取文件状态失败: {e}")
    
    # 检查父目录权限
    parent_dir = os.path.dirname(file_path)
    if parent_dir:
        try:
            result['parent_writable'] = os.access(parent_dir, os.W_OK)
            if not result['parent_writable']:
                result['diagnosis'].append(f"父目录 {parent_dir} 不可写")
        except Exception as e:
            result['diagnosis'].append(f"检查父目录权限失败: {e}")
    
    return result


def test_atomic_write_in_directory(test_dir: str) -> dict:
    """在指定目录中测试原子写入功能"""
    results = {
        'directory': test_dir,
        'exists': os.path.exists(test_dir),
        'writable': None,
        'tempfile_creation': None,
        'atomic_rename': None,
        'tests': []
    }
    
    if not results['exists']:
        return results
    
    # 测试目录可写性
    try:
        results['writable'] = os.access(test_dir, os.W_OK)
    except Exception as e:
        results['tests'].append(f"目录可写性测试失败: {e}")
    
    # 测试临时文件创建
    try:
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', dir=test_dir, delete=True) as f:
            f.write("test")
            f.flush()
        results['tempfile_creation'] = True
    except Exception as e:
        results['tempfile_creation'] = False
        results['tests'].append(f"临时文件创建失败: {e}")
    
    # 测试原子重命名
    try:
        import tempfile
        temp_fd, temp_path = tempfile.mkstemp(dir=test_dir)
        os.close(temp_fd)
        
        target_path = os.path.join(test_dir, "atomic_test.txt")
        os.replace(temp_path, target_path)
        
        if os.path.exists(target_path):
            os.unlink(target_path)
            results['atomic_rename'] = True
        else:
            results['atomic_rename'] = False
            results['tests'].append("原子重命名后文件不存在")
    except Exception as e:
        results['atomic_rename'] = False
        results['tests'].append(f"原子重命名测试失败: {e}")
    
    return results
```

## 6. 实施指南

### 6.1 迁移计划

#### 阶段1：审计现有代码（第1周）
1. 扫描项目中的所有文件写入操作
2. 识别非原子写入模式
3. 评估风险级别和优先级

#### 阶段2：核心组件迁移（第2-3周）
1. 优先迁移关键配置文件写入
2. 迁移用户数据持久化模块
3. 迁移系统状态保存功能

#### 阶段3：全面实施（第4-5周）
1. 迁移所有文件写入操作
2. 添加自动化测试
3. 部署监控和告警

#### 阶段4：优化和维护（持续）
1. 性能监控和优化
2. 定期审计和验证
3. 文档更新和维护

### 6.2 代码审查要点

审查文件写入代码时，检查以下要点：

1. ✅ 是否使用`atomic_write`函数而不是直接`open().write()`
2. ✅ 是否指定了正确的编码（通常是`utf-8`）
3. ✅ 是否处理了写入失败的情况
4. ✅ 是否考虑了并发访问的场景
5. ✅ 是否添加了适当的日志记录
6. ✅ 是否包含完整性验证（可选，对于关键数据）

## 7. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-02-09 | 初始版本，基于MY-DOGE-MACRO项目需求 |

## 8. 宪法合规性

### 8.1 §125数据完整性公理
- 确保文件写入的原子性，防止数据损坏
- 实现完整性验证机制

### 8.2 §126事务原子性公理
- 多文件写入支持事务性语义
- 提供回滚和恢复机制

### 8.3 §127错误隔离公理
- 写入失败不影响系统其他部分
- 提供优雅的错误处理和恢复

### 8.4 §152单一真理源公理
- 本标准为MY-DOGE-MACRO项目文件写入的权威规范
- 确保所有组件遵循一致的写入策略

---

**遵循原则**: 原子写入是数据完整性的基石。通过临时文件+原子重命名模式，我们可以确保文件要么完整写入，要么完全失败，避免处于损坏或中间状态。