// 简单力导向算法工作线程 - 基础版本（无外部依赖）
interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Link {
  source: string;
  target: string;
  strength?: number;
}

let nodes: Node[] = [];
let links: Link[] = [];
let running = false;
let animationFrameId: number | null = null;

// 力导向参数
const REPULSION_STRENGTH = -30;
const LINK_DISTANCE = 100;
const LINK_STRENGTH = 0.1;
const CENTER_STRENGTH = 0.01;
const VELOCITY_DECAY = 0.6;

function applyForces() {
  if (!running) {
    return;
  }

  const centerX = 400; // 假设画布中心
  const centerY = 300;

  // 计算节点间斥力
  for (let i = 0; i < nodes.length; i++) {
    let fx = 0;
    let fy = 0;
    const node1 = nodes[i];

    // 节点间斥力
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) {
        continue;
      }
      const node2 = nodes[j];
      const dx = node1.x - node2.x;
      const dy = node1.y - node2.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = REPULSION_STRENGTH / (distance * distance);
      fx += (dx / distance) * force;
      fy += (dy / distance) * force;
    }

    // 向中心引力
    const dxCenter = centerX - node1.x;
    const dyCenter = centerY - node1.y;
    fx += dxCenter * CENTER_STRENGTH;
    fy += dyCenter * CENTER_STRENGTH;

    // 连接力
    for (const link of links) {
      if (link.source === node1.id) {
        const targetNode = nodes.find((n) => n.id === link.target);
        if (targetNode) {
          const dx = targetNode.x - node1.x;
          const dy = targetNode.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (distance - LINK_DISTANCE) * LINK_STRENGTH;
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        }
      }
    }

    // 更新速度（考虑衰减）
    node1.vx = (node1.vx + fx) * VELOCITY_DECAY;
    node1.vy = (node1.vy + fy) * VELOCITY_DECAY;
  }

  // 更新位置
  for (const node of nodes) {
    node.x += node.vx;
    node.y += node.vy;
  }

  // 发送位置更新到主线程
  const positions = new Float32Array(nodes.length * 2);
  for (let i = 0; i < nodes.length; i++) {
    positions[i * 2] = nodes[i].x;
    positions[i * 2 + 1] = nodes[i].y;
  }

  postMessage({ type: 'UPDATE_POSITIONS', positions }, { transfer: [positions.buffer] });

  // 继续下一帧
  animationFrameId = requestAnimationFrame(applyForces);
}

self.onmessage = (e: MessageEvent) => {
  const { type, nodes: newNodes, links: newLinks } = e.data;

  if (type === 'INIT_DATA') {
    nodes = newNodes || [];
    links = newLinks || [];

    // 预热计算
    for (let i = 0; i < 50; i++) {
      applyForces();
    }

    // 发送初始位置
    const positions = new Float32Array(nodes.length * 2);
    for (let i = 0; i < nodes.length; i++) {
      positions[i * 2] = nodes[i].x;
      positions[i * 2 + 1] = nodes[i].y;
    }
    postMessage({ type: 'TICK', nodes: nodes, positions }, { transfer: [positions.buffer] });
  }

  if (type === 'START_TICK') {
    if (!running) {
      running = true;
      animationFrameId = requestAnimationFrame(applyForces);
    }
  }

  if (type === 'STOP_TICK') {
    running = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  if (type === 'UPDATE_NODES') {
    const updates = e.data.updates;
    updates.forEach((update: { id: string; x?: number; y?: number }) => {
      const node = nodes.find((n) => n.id === update.id);
      if (node) {
        if (update.x !== undefined) {
          node.x = update.x;
        }
        if (update.y !== undefined) {
          node.y = update.y;
        }
      }
    });
  }
};
