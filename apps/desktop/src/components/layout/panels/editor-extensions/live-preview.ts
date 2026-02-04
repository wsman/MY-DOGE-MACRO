import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';

// 定义一个零宽度的 Widget，用于替换被隐藏的 Markdown 标记
class HiddenMarkWidget extends WidgetType {
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-md-mark';
    return span;
  }
}

// 样式装饰器
const hiddenDecoration = Decoration.replace({
  widget: new HiddenMarkWidget(),
  inclusive: false,
});

// 标题样式装饰器 (保留文本，改变外观)
const heading1Decoration = Decoration.mark({ class: 'cm-heading-1' });
const heading2Decoration = Decoration.mark({ class: 'cm-heading-2' });
const heading3Decoration = Decoration.mark({ class: 'cm-heading-3' });
const boldDecoration = Decoration.mark({ class: 'cm-bold-text' });
const italicDecoration = Decoration.mark({ class: 'cm-italic-text' });

export const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.computeDecorations(view);
    }

    update(update: ViewUpdate) {
      // 性能优化：仅在文档内容变更、选区变更或视口变更时重新计算
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = this.computeDecorations(update.view);
      }
    }

    computeDecorations(view: EditorView): DecorationSet {
      const builder = new RangeSetBuilder<Decoration>();
      const { state } = view;
      const tree = syntaxTree(state);
      const selection = state.selection.main;
      const cursorHead = selection.head;

      for (const { from, to } of view.visibleRanges) {
        tree.iterate({
          from,
          to,
          enter: (node) => {
            // --------------------
            // 算法核心：区间碰撞检测 (Interval Collision Detection)
            // 如果光标在节点范围内 [node.from, node.to]，则认为是"激活状态"，展示源码
            // 否则，应用隐藏/样式装饰器
            // --------------------
            const isCursorInside = cursorHead >= node.from && cursorHead <= node.to;

            // 1. 处理粗体 (StrongEmphasis) -> **text**
            // 语法树结构通常是: StrongEmphasis( from, to )
            // 我们假设 ** 长度为 2
            if (node.name === 'StrongEmphasis') {
              if (!isCursorInside) {
                // 隐藏前 2 个字符 (**)
                builder.add(node.from, node.from + 2, hiddenDecoration);
                // 隐藏后 2 个字符 (**)
                builder.add(node.to - 2, node.to, hiddenDecoration);
                // 给中间文本加粗
                builder.add(node.from + 2, node.to - 2, boldDecoration);
              }
            }

            // 2. 处理斜体 (Emphasis) -> *text*
            else if (node.name === 'Emphasis') {
              if (!isCursorInside) {
                // 隐藏前后各 1 个字符 (*)
                builder.add(node.from, node.from + 1, hiddenDecoration);
                builder.add(node.to - 1, node.to, hiddenDecoration);
                // 给中间文本斜体
                builder.add(node.from + 1, node.to - 1, italicDecoration);
              }
            }

            // 3. 处理标题 (ATXHeading) -> # Title
            else if (node.name === 'ATXHeading1') {
              // 始终应用大号字体样式 (无论光标在哪里)
              builder.add(node.from, node.to, heading1Decoration);

              if (!isCursorInside) {
                // 隐藏 "# " (假设是一个 # 和一个空格，长度 2)
                // 注意：严格来说需要检查源码是否真的是 "# "，这里做简化假设
                builder.add(node.from, node.from + 2, hiddenDecoration);
              }
            } else if (node.name === 'ATXHeading2') {
              builder.add(node.from, node.to, heading2Decoration);
              if (!isCursorInside) {
                builder.add(node.from, node.from + 3, hiddenDecoration);
              } // "## "
            } else if (node.name === 'ATXHeading3') {
              builder.add(node.from, node.to, heading3Decoration);
              if (!isCursorInside) {
                builder.add(node.from, node.from + 4, hiddenDecoration);
              } // "### "
            }

            // 4. 处理分割线 (HorizontalRule) -> --
            else if (node.name === 'HorizontalRule') {
              if (!isCursorInside) {
                // 暂时保持原样，可以未来替换为一条漂亮的 <hr> widget
                // builder.add(node.from, node.to, hiddenDecoration);
              }
            }

            // 5. 处理代码块 (FencedCode) -> ```...```
            else if (node.name === 'FencedCode') {
              if (!isCursorInside) {
                // 隐藏前后各 3 个字符 (```)
                builder.add(node.from, node.from + 3, hiddenDecoration);
                builder.add(node.to - 3, node.to, hiddenDecoration);
              }
            }

            // 6. 处理行内代码 (InlineCode) -> `code`
            else if (node.name === 'InlineCode') {
              if (!isCursorInside) {
                // 隐藏前后各 1 个字符 (`)
                builder.add(node.from, node.from + 1, hiddenDecoration);
                builder.add(node.to - 1, node.to, hiddenDecoration);
              }
            }
          },
        });
      }

      return builder.finish();
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
