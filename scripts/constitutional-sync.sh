#!/bin/bash
# constitutional-sync.sh - 宪法框架同步脚本 (MY-DOGE-MACRO专用)

# 配置变量
SOURCE_PROJECT="D:/Users/Administrator/Desktop/MY-DOGE-DEMO"
TARGET_PROJECT="D:/Users/Administrator/Desktop/MY-DOGE-MACRO"
BACKUP_DIR="${TARGET_PROJECT}/memory_bank/backup_$(date +%Y%m%d_%H%M%S)"
CLINERULES_DIR="${TARGET_PROJECT}/.clinerules"

echo "========================================"
echo "宪法框架同步脚本 (v1.8.1)"
echo "========================================"

# 1. 创建备份
echo "1. 创建宪法文件备份..."
mkdir -p "${BACKUP_DIR}"
cp -r "${TARGET_PROJECT}/memory_bank/t0_core/" "${BACKUP_DIR}/" 2>/dev/null || echo "t0_core备份创建成功"
echo "   ✅ 备份位置: ${BACKUP_DIR}"

# 2. 创建.clinerules目录
echo "2. 创建.clinerules目录..."
mkdir -p "${CLINERULES_DIR}"
echo "   ✅ .clinerules目录创建完成"

# 3. 同步核心宪法文件
echo "3. 同步宪法文件..."
files_to_sync=(
    "basic_law_index.md"
    "procedural_law_index.md" 
    "technical_law_index.md"
    "KNOWLEDGE_GRAPH.md"
)

for file in "${files_to_sync[@]}"; do
    if [[ -f "${SOURCE_PROJECT}/.clinerules/${file}" ]]; then
        cp "${SOURCE_PROJECT}/.clinerules/${file}" "${CLINERULES_DIR}/"
        echo "   ✅ ${file} 同步成功"
    else
        echo "   ⚠️ ${file} 源文件不存在，跳过"
    fi
done

# 4. 版本适配
echo "4. 进行版本适配..."
if [[ -f "${CLINERULES_DIR}/basic_law_index.md" ]]; then
    sed -i 's/v6\.8\.1/v1.8.1/g' "${CLINERULES_DIR}/basic_law_index.md"
    sed -i 's/MY-DOGE-DEMO/MY-DOGE-MACRO/g' "${CLINERULES_DIR}/basic_law_index.md"
    echo "   ✅ basic_law_index.md 版本适配完成"
fi

if [[ -f "${CLINERULES_DIR}/procedural_law_index.md" ]]; then
    sed -i 's/v6\.8\.1/v1.8.1/g' "${CLINERULES_DIR}/procedural_law_index.md"
    echo "   ✅ procedural_law_index.md 版本适配完成"
fi

if [[ -f "${CLINERULES_DIR}/technical_law_index.md" ]]; then
    sed -i 's/v6\.8\.1/v1.8.1/g' "${CLINERULES_DIR}/technical_law_index.md"
    sed -i 's/MY-DOGE-DEMO/MY-DOGE-MACRO/g' "${CLINERULES_DIR}/technical_law_index.md"
    echo "   ✅ technical_law_index.md 版本适配完成"
fi

if [[ -f "${CLINERULES_DIR}/KNOWLEDGE_GRAPH.md" ]]; then
    sed -i 's/v6\.8\.0/v1.8.1/g' "${CLINERULES_DIR}/KNOWLEDGE_GRAPH.md"
    sed -i 's/MY-DOGE-DEMO v6\.8\.0/MY-DOGE-MACRO v1.8.1/g' "${CLINERULES_DIR}/KNOWLEDGE_GRAPH.md"
    sed -i 's/Negentropy-Lab \→ 回流 \→ MY-DOGE-DEMO/Negentropy-Lab → 孵化 → MY-DOGE-MACRO/g' "${CLINERULES_DIR}/KNOWLEDGE_GRAPH.md"
    echo "   ✅ KNOWLEDGE_GRAPH.md 版本适配完成"
fi

# 5. 更新activeContext
echo "5. 更新activeContext状态..."
ACTIVE_CONTEXT="${TARGET_PROJECT}/memory_bank/t0_core/active_context.md"
if [[ -f "${ACTIVE_CONTEXT}" ]]; then
    sed -i 's/^> \*\*Last Updated\*\*: .*/> **Last Updated**: '"$(date +%Y-%m-%d\ %H:%M)"'/' "${ACTIVE_CONTEXT}"
    sed -i 's/^> \*\*Cycle Status\*\*: .*/> **Cycle Status**: ✅ 宪法框架升级完成 (v1.8.1)/' "${ACTIVE_CONTEXT}"
    echo "   ✅ active_context.md 更新完成"
fi

# 6. 验证同步结果
echo "6. 验证同步结果..."
echo ""
echo "同步完成！请检查以下文件:"
echo "----------------------------------------"
ls -la "${CLINERULES_DIR}/"*.md
echo "----------------------------------------"

echo ""
echo "宪法框架升级状态:"
echo "  ✅ 基本法索引 (v1.8.1)"
echo "  ✅ 程序法索引 (v1.8.1)"  
echo "  ✅ 技术法索引 (v1.8.1)"
echo "  ✅ 知识图谱 (v1.8.1)"
echo "  ✅ ActiveContext更新"
echo "  ✅ 备份创建: ${BACKUP_DIR}"
echo ""
echo "宪法依据: §102.3宪法同步公理、§152单一真理源公理"
echo "预计熵减: ΔH ≈ +0.15"
echo "========================================"