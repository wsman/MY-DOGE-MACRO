import { useEffect, useRef, memo, useCallback } from 'react';
import { Application, Graphics } from 'pixi.js';

// ============ Props 类型定义 ============
interface PixiGraphProps {
  data?: {
    nodes: Array<{
      id: string;
      name: string;
      x: number;
      y: number;
      vx: number;
      vy: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      strength: number;
    }>;
  };
  width?: number;
  height?: number;
}

// ============ 内部组件逻辑 ============
const PixiGraphInner = (props: PixiGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const appRef = useRef<Application | null>(null);
  const nodeGraphicsRef = useRef<Graphics[]>([]);

  // 使用 useCallback 稳定回调函数引用
  const initPixiApp = useCallback(async (container: HTMLElement) => {
    const app = new Application({
      resizeTo: container,
      antialias: true,
      backgroundColor: 0x1e1e1e,
    });
    await app.init();
    container.appendChild(app.canvas);
    return app;
  }, []);

  const createNodes = useCallback(
    (
      app: Application,
      nodes: Array<{ id: string; name: string; x: number; y: number; vx: number; vy: number }>
    ) => {
      const stage = app.stage;
      nodes.forEach((node: { x: number; y: number }) => {
        const gfx = new Graphics({});
        gfx.circle(0, 0, 4);
        gfx.fill(0x00ee99);
        gfx.x = node.x;
        gfx.y = node.y;
        stage.addChild(gfx);
        nodeGraphicsRef.current.push(gfx);
      });
    },
    []
  );

  const createLinks = useCallback((app: Application) => {
    const linkGraphics = new Graphics({});
    app.stage.addChild(linkGraphics);
    return linkGraphics;
  }, []);

  // 主初始化逻辑
  useEffect(() => {
    let app: Application | null = null;
    let cleanupDone = false;

    async function init() {
      if (!containerRef.current || cleanupDone) {
        return;
      }

      // 初始化 PixiJS
      app = await initPixiApp(containerRef.current);
      if (cleanupDone) {
        app?.destroy(true);
        return;
      }
      appRef.current = app;

      // 初始化 Worker
      workerRef.current = new Worker(new URL('../../workers/graph.worker.ts', import.meta.url));

      // 获取数据
      const nodes =
        props.data?.nodes ||
        Array.from({ length: 1000 }, (_, i) => ({
          id: `n${i}`,
          name: `Node ${i}`,
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: 0,
          vy: 0,
        }));
      const links =
        props.data?.links ||
        Array.from({ length: 999 }, (_, i) => ({
          source: `n${i}`,
          target: `n${i + 1}`,
          strength: 1.0,
        }));

      // 创建节点
      createNodes(app, nodes);

      // 创建连接
      const linkGraphics = createLinks(app);

      // 监听 Worker 更新
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'UPDATE_POSITIONS' && app) {
          const positions = new Float32Array(e.data.positions);
          // 直接操作 Pixi 对象，不触发 React 重渲染
          for (let i = 0; i < nodeGraphicsRef.current.length; i++) {
            const gfx = nodeGraphicsRef.current[i];
            gfx.x = positions[i * 2];
            gfx.y = positions[i * 2 + 1];
          }

          // 更新连接线
          linkGraphics.clear();
          linkGraphics.lineStyle(1, 0x333333, 0.3);
          for (let i = 0; i < links.length; i++) {
            const sourceIdx = parseInt(links[i].source.substring(1));
            const targetIdx = parseInt(links[i].target.substring(1));
            if (sourceIdx < positions.length / 2 && targetIdx < positions.length / 2) {
              linkGraphics.moveTo(positions[sourceIdx * 2], positions[sourceIdx * 2 + 1]);
              linkGraphics.lineTo(positions[targetIdx * 2], positions[targetIdx * 2 + 1]);
            }
          }
        }
      };

      // 启动仿真
      workerRef.current.postMessage({
        type: 'INIT_DATA',
        nodes: nodes.map((n) => ({ id: n.id, x: n.x, y: n.y, vx: 0, vy: 0 })),
        links,
      });
      workerRef.current.postMessage({ type: 'START_TICK' });
    }

    init();

    return () => {
      cleanupDone = true;
      app?.destroy(true);
      workerRef.current?.terminate();
    };
  }, [props.data, initPixiApp, createNodes, createLinks]);

  return <div ref={containerRef} className="w-full h-full" />;
};

// ============ 自定义比较函数 ============
const areEqual = (prevProps: PixiGraphProps, nextProps: PixiGraphProps) => {
  // 仅当 data 引用相同时才触发重渲染
  return prevProps.data === nextProps.data;
};

// ============ 导出 memo 包装的组件 ============
export const PixiGraph = memo(PixiGraphInner, areEqual);

// 导出组件显示名称（调试用）
PixiGraph.displayName = 'PixiGraph';
