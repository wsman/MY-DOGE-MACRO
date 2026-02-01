import React, { useState, useEffect, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { IDockviewPanelProps } from 'dockview';
import { Save, FileText, CheckCircle, Database, AlertCircle } from 'lucide-react';
import { api } from '../../../services/api';
import { livePreviewPlugin } from './editor-extensions/live-preview';

const DEFAULT_NOTE = `# Weekly Strategy Note

## 1. Market Overview
Target: $NVDA
Entry Price: 120.50

## 2. Alpha Factors
$$
\\alpha = \\sum_{i=0}^{n} w_i \\cdot x_i
$$

## 3. Todo
- [ ] Review Backtest results
- [ ] Check new Tdx data
`;

interface StockLite {
  label: string;  // 下拉列表显示: "000001 平安银行"
  code: string;   // 插入文本: "$000001"
  detail: string; // 详情信息: "12.34 (+1.2%)"
}

export const ResearchEditor: React.FC<IDockviewPanelProps> = () => {
  const [code, setCode] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [stockList, setStockList] = useState<StockLite[]>([]);
  const [dataStatus, setDataStatus] = useState<'loading' | 'linked' | 'error'>('loading');

  // 1. 初始化：加载笔记 + 神经连接 (获取市场数据)
  useEffect(() => {
    const saved = localStorage.getItem('research_note');
    setCode(saved || DEFAULT_NOTE);

    const loadStocks = async () => {
      try {
        // ✅ 修正 API 路径
        const res: any = await api.get('/api/v1/market/snapshot');
        
        // 确保数据结构符合 { columns: [], data: [] }
        if (res && res.columns && res.data) {
          // ✅ 严格映射后端列索引 (code, name, price, pct_chg, vol, industry)
          const codeIdx = res.columns.indexOf('code');
          const nameIdx = res.columns.indexOf('name');
          const priceIdx = res.columns.indexOf('price');
          const chgIdx = res.columns.indexOf('pct_chg');

          // 高效转换
          const list = res.data.map((row: any[]) => {
            const code = row[codeIdx];
            const name = row[nameIdx];
            const price = Number(row[priceIdx]).toFixed(2);
            const chg = Number(row[chgIdx]);
            
            return {
              label: `${code} ${name}`,
              code: `$${code}`, 
              // 构造富文本详情
              detail: `${price} (${chg > 0 ? '+' : ''}${chg.toFixed(2)}%)`
            };
          });

          setStockList(list);
          setDataStatus('linked');
          console.log(`🧠 [Brain] Cortex linked with ${list.length} market symbols.`);
        } else {
          // 数据为空也视为成功连接，只是没有标的
          setDataStatus('linked');
        }
      } catch (e) {
        console.warn("❌ Failed to link market data:", e);
        setDataStatus('error');
      }
    };

    loadStocks();
  }, []);

  // 2. 智能补全逻辑 (Neural Completion)
  const stockCompletion = useCallback((context: CompletionContext): CompletionResult | null => {
    // 匹配光标前的 "$" 符号及其后的字符
    let word = context.matchBefore(/\$\w*/);
    
    if (!word) return null;
    // 如果只有 "$" 且没有显式触发，也进行匹配
    if (word.from == word.to && !context.explicit) return null;

    return {
      from: word.from,
      options: stockList.map(stock => ({
        label: stock.label,
        detail: stock.detail,
        apply: stock.code + " ", // 插入后自动加空格，方便连续输入
        type: "variable",
        boost: 99 // 提高优先级
      })),
      filter: true // 启用模糊匹配 (输入 "PA" 也能匹配 "平安")
    };
  }, [stockList]);

  // 3. 保存逻辑
  const handleSave = useCallback(() => {
    localStorage.setItem('research_note', code);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [code]);

  // 4. 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // 5. 主题定义
  const myTheme = EditorView.theme({
    "&": { height: "100%", fontSize: "14px", backgroundColor: "#1e1e1e" },
    ".cm-scroller": { fontFamily: "'JetBrains Mono', Consolas, monospace" },
    ".cm-content": { caretColor: "#0e9", paddingBottom: "100px" },
    "&.cm-focused .cm-cursor": { borderLeftColor: "#0e9" },
    "&.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "#074" },
    ".cm-gutters": { backgroundColor: "#1e1e1e", color: "#666", borderRight: "1px solid #333" },
    
    // 自定义补全弹窗样式 (适配 Dark Mode)
    ".cm-tooltip": { backgroundColor: "#252526", border: "1px solid #454545", borderRadius: "4px" },
    ".cm-tooltip-autocomplete": { "& > ul > li": { padding: "4px 8px" } },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "#094771", color: "#fff" },
    ".cm-completionIcon": { display: "none" }, // 隐藏默认图标，更简洁
    ".cm-completionDetail": { float: "right", color: "#888", fontStyle: "italic", marginLeft: "10px" }
  }, { dark: true });

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#252526]">
        <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
          <div className="flex items-center gap-1.5">
            <FileText size={14} className="text-blue-400" />
            <span>STRATEGY.md</span>
          </div>
          
          {/* 状态指示器 */}
          {dataStatus === 'linked' && (
            <span className="text-[10px] bg-blue-900/30 px-1.5 py-0.5 rounded text-blue-300 flex items-center gap-1 border border-blue-800/50 transition-all duration-500" title={`Connected to ${stockList.length} symbols`}>
              <Database size={10} /> Data Linked
            </span>
          )}
          {dataStatus === 'error' && (
            <span className="text-[10px] text-yellow-500 flex items-center gap-1" title="Market data offline">
              <AlertCircle size={10} /> Offline Mode
            </span>
          )}

          {isSaved && <span className="text-xs text-green-500 flex items-center gap-1 animate-fade-in"><CheckCircle size={10} /> Saved</span>}
        </div>
        
        <button 
          onClick={handleSave}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-green-400 transition-colors"
          title="Save (Ctrl+S)"
        >
          <Save size={14} />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative group">
        <CodeMirror
          value={code}
          height="100%"
          theme="dark"
          extensions={[
            markdown({ base: markdownLanguage, codeLanguages: languages }),
            autocompletion({ override: [stockCompletion] }), // ✅ 注入补全引擎
            livePreviewPlugin, // ✅ Live Preview 实时预览引擎
            myTheme,
            EditorView.lineWrapping,
          ]}
          onChange={(val) => setCode(val)}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
            autocompletion: true,
          }}
        />
      </div>
    </div>
  );
};