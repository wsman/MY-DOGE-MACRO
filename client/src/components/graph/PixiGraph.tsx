import React, { useEffect, useRef } from 'react';
import { Application, Graphics } from 'pixi.js';

export const PixiGraph = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const workerRef = useRef<Worker>();
    const appRef = useRef<Application>();
    const nodeGraphicsRef = useRef<Graphics[]>([]);

    useEffect(() => {
        // 1. 初始化 PixiJS 应用
        const app = new Application();
        
        async function init() {
            await app.init({ 
                resizeTo: containerRef.current!, 
                antialias: true,
                backgroundColor: 0x1e1e1e 
            });
            containerRef.current?.appendChild(app.canvas);
            appRef.current = app;

            // 2. 初始化 Worker
            workerRef.current = new Worker(new URL('../../workers/graph.worker.ts', import.meta.url), {
                type: 'module'
            });

            // 3. 模拟数据 (生产环境从 Zustand Store 获取)
            const nodes = Array.from({ length: 1000 }, (_, i) => ({ 
                id: `n${i}`, 
                name: `Node ${i}`,
                x: Math.random() * 800,
                y: Math.random() * 600,
                vx: 0,
                vy: 0
            }));
            const links = Array.from({ length: 999 }, (_, i) => ({ 
                source: `n${i}`, 
                target: `n${i+1}`,
                strength: 1.0
            }));
            
            // 4. 创建图形对象池 (Object Pooling)
            const stage = app.stage;
            nodes.forEach((node) => {
                const gfx = new Graphics();
                gfx.circle(0, 0, 4); // 半径4的圆
                gfx.fill(0x00ee99);
                gfx.x = node.x;
                gfx.y = node.y;
                stage.addChild(gfx);
                nodeGraphicsRef.current.push(gfx);
            });

            // 5. 创建连接线
            const linkGraphics = new Graphics();
            stage.addChild(linkGraphics);

            // 6. 监听 Worker 更新
            workerRef.current.onmessage = (e) => {
                if (e.data.type === 'UPDATE_POSITIONS') {
                    const positions = new Float32Array(e.data.positions);
                    // 极速更新：直接操作 Pixi 对象的 transform，不触发 React 重渲染
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
                        if (sourceIdx < positions.length/2 && targetIdx < positions.length/2) {
                            linkGraphics.moveTo(
                                positions[sourceIdx * 2],
                                positions[sourceIdx * 2 + 1]
                            );
                            linkGraphics.lineTo(
                                positions[targetIdx * 2],
                                positions[targetIdx * 2 + 1]
                            );
                        }
                    }
                }
            };

            // 7. 启动仿真
            workerRef.current.postMessage({ 
                type: 'INIT_DATA', 
                nodes: nodes.map(n => ({ id: n.id, x: n.x, y: n.y, vx: 0, vy: 0 })),
                links 
            });
            workerRef.current.postMessage({ type: 'START_TICK' });
        }

        init();

        return () => {
            app.destroy(true);
            workerRef.current?.terminate();
        };
    }, []);

    return <div ref={containerRef} className="w-full h-full" />;
};