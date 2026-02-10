# DS-001: UTF-8输出配置标准实现

**版本**: v1.0.0
**状态**: 🟢 活跃
**宪法依据**: §124编码一致性公理、§125数据完整性公理
**最后更新**: 2026-02-09

## 1. 范围

本规范适用于MY-DOGE-MACRO项目中所有文件输出操作，确保UTF-8编码一致性。涵盖以下场景：
- 文本文件写入（配置文件、日志文件、数据文件等）
- API响应输出（JSON、XML、纯文本等）
- 系统间数据交换
- 文件持久化操作

## 2. 技术要求

### 2.1 编码要求

| 编码类型 | 使用场景 | 强制要求 |
|----------|----------|----------|
| **UTF-8 (无BOM)** | 所有文本文件（Python、TypeScript、Markdown、JSON、YAML等） | ✅ 必须使用 |
| **UTF-8 (带BOM)** | Windows兼容性场景（仅在必要时） | ⚠️ 谨慎使用 |
| **ASCII** | 纯英文且无特殊字符的场景 | ⚠️ 不推荐，UTF-8优先 |
| **其他编码（GBK、GB2312、Latin-1等）** | 第三方系统集成、遗留系统兼容 | ❌ 禁止（特殊情况需文档记录） |

### 2.2 文件写入规范

#### Python实现要求

```python
# ✅ 正确示例：明确指定UTF-8编码
def save_to_file(file_path: str, content: str) -> None:
    """保存文本到文件，使用UTF-8编码"""
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

# ✅ 正确示例：二进制写入（不涉及编码）
def save_binary_data(file_path: str, data: bytes) -> None:
    """保存二进制数据"""
    with open(file_path, 'wb') as f:
        f.write(data)

# ❌ 错误示例：未指定编码，使用系统默认编码
def bad_save_to_file(file_path: str, content: str) -> None:
    """错误的保存方式，可能导致编码问题"""
    with open(file_path, 'w') as f:  # 缺少encoding参数
        f.write(content)
```

#### TypeScript/JavaScript实现要求

```typescript
// ✅ 正确示例：使用TextEncoder进行UTF-8编码
export async function saveFile(filePath: string, content: string): Promise<void> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  await Deno.writeFile(filePath, data);  // 或使用其他文件系统API
}

// ✅ 正确示例：Node.js环境下
import { writeFile } from 'fs/promises';

export async function saveWithNode(filePath: string, content: string): Promise<void> {
  // Node.js的writeFile默认使用UTF-8，但建议明确指定
  await writeFile(filePath, content, { encoding: 'utf-8' });
}
```

### 2.3 文件读取规范

#### Python实现要求

```python
# ✅ 正确示例：明确指定UTF-8编码读取
def read_from_file(file_path: str) -> str:
    """从文件读取文本，使用UTF-8编码"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

# ✅ 正确示例：自动检测并处理编码错误
def safe_read_from_file(file_path: str) -> str:
    """安全读取文件，处理可能的编码问题"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        # 尝试其他编码（仅在必要时）
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            return f.read()
```

### 2.4 配置要求

#### Python项目配置

在项目的根目录`pyproject.toml`或`setup.cfg`中应包含编码配置：

```toml
# pyproject.toml 示例
[tool.black]
line-length = 88
target-version = ['py312']

[tool.isort]
profile = "black"
multi_line_output = 3
include_trailing_comma = true
```

#### 推荐的开发环境配置

1. **VS Code设置**：
```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "[python]": {
    "files.encoding": "utf8"
  },
  "[typescript]": {
    "files.encoding": "utf8"
  },
  "[javascript]": {
    "files.encoding": "utf8"
  }
}
```

2. **Git配置**：
```bash
# 配置Git正确处理UTF-8
git config --global core.quotepath false
git config --global i18n.logOutputEncoding utf8
git config --global i18n.commitEncoding utf8
```

## 3. 验证方法

### 3.1 自动化检查

#### Python验证函数

```python
import os

def validate_utf8_encoding(file_path: str) -> bool:
    """
    验证文件是否为有效的UTF-8编码
    
    参数:
        file_path: 文件路径
        
    返回:
        bool: 如果文件为有效UTF-8编码返回True，否则返回False
    """
    if not os.path.exists(file_path):
        return False
    
    try:
        # 尝试以UTF-8读取文件
        with open(file_path, 'r', encoding='utf-8') as f:
            f.read()
        return True
    except UnicodeDecodeError:
        # 文件包含非UTF-8编码字符
        return False
    except Exception as e:
        # 其他错误（如二进制文件）
        print(f"验证文件 {file_path} 时出错: {e}")
        return False


def validate_utf8_with_bom(file_path: str) -> tuple[bool, bool]:
    """
    验证文件编码并检测是否包含BOM
    
    返回:
        tuple[bool, bool]: (是否为UTF-8, 是否包含BOM)
    """
    if not os.path.exists(file_path):
        return (False, False)
    
    try:
        # 先尝试不带BOM的UTF-8
        with open(file_path, 'r', encoding='utf-8') as f:
            f.read()
        return (True, False)
    except UnicodeDecodeError:
        try:
            # 尝试带BOM的UTF-8
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                content = f.read()
                # 检查是否真的有BOM
                if content.startswith('\ufeff'):
                    return (True, True)
                else:
                    return (True, False)
        except UnicodeDecodeError:
            return (False, False)
```

#### TypeScript验证函数

```typescript
/**
 * 验证文件是否为有效的UTF-8编码
 */
export async function validateUTF8Encoding(filePath: string): Promise<boolean> {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const data = await Deno.readFile(filePath);
    decoder.decode(data);
    return true;
  } catch (error) {
    if (error instanceof TypeError) {
      // 非UTF-8编码
      return false;
    }
    throw error;
  }
}
```

### 3.2 集成测试

#### Python单元测试

```python
import pytest
import tempfile
import os
from pathlib import Path

def test_utf8_encoding_validation():
    """测试UTF-8编码验证功能"""
    
    # 测试有效UTF-8文件
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', suffix='.txt', delete=False) as f:
        f.write("这是UTF-8编码的文本，包含中文和特殊字符: 🎉\n")
        valid_file = f.name
    
    try:
        assert validate_utf8_encoding(valid_file) == True
    finally:
        os.unlink(valid_file)
    
    # 测试非UTF-8文件（创建GBK编码文件）
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.txt', delete=False) as f:
        f.write("这是GBK编码文本".encode('gbk'))
        invalid_file = f.name
    
    try:
        assert validate_utf8_encoding(invalid_file) == False
    finally:
        os.unlink(invalid_file)
    
    # 测试二进制文件
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.png', delete=False) as f:
        f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00')
        binary_file = f.name
    
    try:
        # 二进制文件不应通过UTF-8验证
        assert validate_utf8_encoding(binary_file) == False
    finally:
        os.unlink(binary_file)


def test_utf8_file_operations():
    """测试UTF-8文件操作"""
    test_content = "UTF-8测试内容：🎉🎊✨ 中文测试 😊"
    
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', suffix='.json', delete=False) as f:
        f.write(test_content)
        test_file = f.name
    
    try:
        # 验证写入的内容
        with open(test_file, 'r', encoding='utf-8') as f:
            read_content = f.read()
            assert read_content == test_content
        
        # 验证文件编码
        assert validate_utf8_encoding(test_file) == True
    finally:
        os.unlink(test_file)
```

### 3.3 预提交钩子检查

创建预提交钩子脚本，自动检查文件编码：

```python
#!/usr/bin/env python3
"""
pre-commit-utf8-check.py
预提交钩子：检查所有文本文件是否为UTF-8编码
"""

import os
import sys
import subprocess
from pathlib import Path

def get_staged_files():
    """获取暂存区中的所有文件"""
    result = subprocess.run(
        ['git', 'diff', '--cached', '--name-only', '--diff-filter=ACMR'],
        capture_output=True,
        text=True,
        encoding='utf-8'
    )
    if result.returncode != 0:
        print("❌ 获取暂存区文件失败")
        return []
    
    files = result.stdout.strip().split('\n')
    return [f for f in files if f]  # 过滤空行


def is_text_file(file_path: str) -> bool:
    """判断文件是否为文本文件"""
    # 常见的文本文件扩展名
    text_extensions = {
        '.py', '.pyi', '.md', '.txt', '.json', '.yaml', '.yml',
        '.toml', '.cfg', '.ini', '.conf', '.html', '.css', '.js',
        '.ts', '.tsx', '.jsx', '.vue', '.svelte', '.xml', '.csv'
    }
    
    path = Path(file_path)
    return path.suffix.lower() in text_extensions


def check_utf8_encoding(file_path: str) -> bool:
    """检查文件是否为UTF-8编码"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            f.read()
        return True
    except UnicodeDecodeError:
        return False


def main():
    """主函数"""
    print("🔍 检查暂存区文件的UTF-8编码...")
    
    staged_files = get_staged_files()
    if not staged_files:
        print("✅ 暂存区没有需要检查的文件")
        return 0
    
    errors = []
    
    for file_path in staged_files:
        if not os.path.exists(file_path):
            # 可能是删除的文件，跳过
            continue
        
        if is_text_file(file_path):
            if not check_utf8_encoding(file_path):
                errors.append(file_path)
                print(f"❌ 文件 {file_path} 不是有效的UTF-8编码")
    
    if errors:
        print("\n❌ 以下文件不是UTF-8编码，请修正：")
        for error in errors:
            print(f"  - {error}")
        print("\n建议解决方案：")
        print("1. 使用支持UTF-8的编辑器重新保存文件")
        print("2. 检查文件内容中是否包含非UTF-8字符")
        print("3. 使用 iconv 命令转换编码:")
        print("   iconv -f GBK -t UTF-8 file.txt > file-utf8.txt")
        return 1
    
    print("✅ 所有文本文件都是有效的UTF-8编码")
    return 0


if __name__ == '__main__':
    sys.exit(main())
```

## 4. 例外情况

### 4.1 二进制文件
- **二进制文件**（如图像、视频、PDF、可执行文件等）不受此规范约束
- **识别方法**：通过文件扩展名或MIME类型识别

### 4.2 第三方集成
- **外部API调用**：接收或发送非UTF-8数据时，必须在接口文档中明确记录
- **遗留系统**：与使用非UTF-8编码的遗留系统交互时，应在边界处进行编码转换

### 4.3 特殊情况
- **系统文件**：某些系统配置文件可能需要特定编码，应在文件中添加注释说明
- **测试文件**：故意包含非UTF-8字符的测试文件应在文件名中明确标识

## 5. 实施计划

### 阶段1：审计与识别（第1周）
1. 扫描项目中的所有文本文件，识别非UTF-8编码的文件
2. 创建问题文件清单和修复优先级
3. 更新`.gitattributes`文件，配置文本文件处理规则

### 阶段2：逐步修复（第2-3周）
1. 按优先级修复非UTF-8编码的文件
2. 更新相关代码，确保所有文件操作明确指定UTF-8编码
3. 添加编码验证到CI/CD流程

### 阶段3：预防与监控（第4周）
1. 部署预提交钩子，防止新的非UTF-8文件提交
2. 添加编码检查到代码审查流程
3. 定期审计，确保标准持续遵守

## 6. 故障排除

### 6.1 常见问题

| 问题 | 症状 | 解决方案 |
|------|------|----------|
| **UnicodeDecodeError** | 读取文件时出现编码错误 | 1. 确认文件编码<br>2. 使用正确的编码参数<br>3. 处理编码错误（errors参数） |
| **乱码显示** | 文本显示为乱码 | 1. 检查终端/编辑器编码设置<br>2. 确保文件实际为UTF-8编码<br>3. 检查字体是否支持所有字符 |
| **BOM问题** | 文件开头有不可见字符 | 1. 使用utf-8-sig编码读取包含BOM的文件<br>2. 保存文件时不带BOM |
| **跨平台兼容性** | Windows/Linux/macOS显示不一致 | 1. 统一使用UTF-8无BOM<br>2. 配置所有开发环境的编码设置 |

### 6.2 调试工具

```bash
# 使用file命令检查文件编码
file -i myfile.txt

# 检查文件是否包含BOM
head -c 3 myfile.txt | od -An -t x1

# 转换文件编码为UTF-8
iconv -f GBK -t UTF-8 input.txt > output-utf8.txt

# 删除BOM
sed -i '1s/^\xEF\xBB\xBF//' file.txt
```

## 7. 性能考虑

1. **编码/解码开销**：UTF-8处理相比ASCII有一定性能开销，但在现代硬件上可以忽略不计
2. **内存使用**：UTF-8字符串在内存中可能比ASCII占用更多空间，但支持国际化需求
3. **兼容性优势**：UTF-8的广泛兼容性减少了因编码问题导致的bug和兼容性工作

## 8. 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-02-09 | 初始版本，基于MY-DOGE-MACRO项目需求 |

## 9. 宪法合规性

### 9.1 §124编码一致性公理
- 所有文本文件使用统一的UTF-8编码
- 消除因编码不一致导致的系统间通信问题

### 9.2 §125数据完整性公理
- 确保文件写入和读取的编码一致性
- 防止数据在持久化过程中损坏或丢失

### 9.3 §152单一真理源公理
- 本标准为MY-DOGE-MACRO项目中所有文件编码的权威规范
- 所有开发、测试、部署环境必须遵守

---

**遵循原则**: 编码一致性是系统稳定性和可维护性的基础。UTF-8作为现代Web和应用的通用编码标准，提供了最佳的国际化和兼容性支持。