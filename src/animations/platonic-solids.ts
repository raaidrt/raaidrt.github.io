export async function initPlatonicSolids(containerId: string): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) { console.error('Container not found:', containerId); return; }
  if (!navigator.gpu) { container.innerHTML = '<p style="text-align:center;padding:2rem;">WebGPU not supported</p>'; return; }
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) { container.innerHTML = '<p style="text-align:center;padding:2rem;">WebGPU adapter not available</p>'; return; }
  const device = await adapter.requestDevice();
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  container.appendChild(canvas);
  const ctx = canvas.getContext('webgpu');
  if (!ctx) { console.error('Failed to get WebGPU context'); return; }
  const format = navigator.gpu.getPreferredCanvasFormat();

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(container!.clientWidth * dpr);
    canvas.height = Math.floor(container!.clientHeight * dpr);
    ctx!.configure({ device, format, alphaMode: 'opaque' });
  }
  resize();
  window.addEventListener('resize', resize);

  const bgColor: GPUColor = { r: 0.992, g: 0.965, b: 0.890, a: 1.0 };

  function createSphere(segments: number = 8): { verts: Float32Array; indices: Uint16Array } {
    const verts: number[] = [], indices: number[] = [];
    for (let lat = 0; lat <= segments; lat++) {
      const theta = lat * Math.PI / segments;
      const sinT = Math.sin(theta), cosT = Math.cos(theta);
      for (let lon = 0; lon <= segments; lon++) {
        const phi = lon * 2 * Math.PI / segments;
        verts.push(Math.cos(phi) * sinT, cosT, Math.sin(phi) * sinT);
      }
    }
    for (let lat = 0; lat < segments; lat++) {
      for (let lon = 0; lon < segments; lon++) {
        const a = lat * (segments + 1) + lon, b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return { verts: new Float32Array(verts), indices: new Uint16Array(indices) };
  }

  function createCylinder(segments: number = 8): { verts: Float32Array; indices: Uint16Array } {
    const verts: number[] = [], indices: number[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = i * 2 * Math.PI / segments;
      verts.push(Math.cos(a), 0, Math.sin(a), Math.cos(a), 1, Math.sin(a));
    }
    for (let i = 0; i < segments; i++) {
      const a = i * 2, b = a + 2;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
    return { verts: new Float32Array(verts), indices: new Uint16Array(indices) };
  }

  const sphere = createSphere(10), cylinder = createCylinder(8);
  const sphereVB = device.createBuffer({ size: sphere.verts.byteLength, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true });
  new Float32Array(sphereVB.getMappedRange()).set(sphere.verts); sphereVB.unmap();
  const sphereIB = device.createBuffer({ size: sphere.indices.byteLength, usage: GPUBufferUsage.INDEX, mappedAtCreation: true });
  new Uint16Array(sphereIB.getMappedRange()).set(sphere.indices); sphereIB.unmap();
  const cylVB = device.createBuffer({ size: cylinder.verts.byteLength, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true });
  new Float32Array(cylVB.getMappedRange()).set(cylinder.verts); cylVB.unmap();
  const cylIB = device.createBuffer({ size: cylinder.indices.byteLength, usage: GPUBufferUsage.INDEX, mappedAtCreation: true });
  new Uint16Array(cylIB.getMappedRange()).set(cylinder.indices); cylIB.unmap();

  const phi = (1 + Math.sqrt(5)) / 2, ip = 1/phi;
  const tetraV = [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(v => v.map(c => c/Math.sqrt(3)));
  const tetraE: [number, number][] = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
  const cubeV = [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]].map(v => v.map(c => c*0.6));
  const cubeE: [number, number][] = [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  const octaV = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const octaE: [number, number][] = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[2,5],[3,4],[3,5]];
  const dodecaV = [[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1],[0,phi,ip],[0,phi,-ip],[0,-phi,ip],[0,-phi,-ip],[ip,0,phi],[-ip,0,phi],[ip,0,-phi],[-ip,0,-phi],[phi,ip,0],[phi,-ip,0],[-phi,ip,0],[-phi,-ip,0]].map(v => { const l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]); return v.map(c => c/l*0.85); });
  const dodecaE: [number, number][] = [[0,12],[0,16],[0,8],[1,14],[1,16],[1,9],[2,12],[2,17],[2,10],[3,14],[3,17],[3,11],[4,13],[4,18],[4,8],[5,15],[5,18],[5,9],[6,13],[6,19],[6,10],[7,15],[7,19],[7,11],[8,9],[10,11],[12,13],[14,15],[16,17],[18,19]];
  const icosaV = [[0,1,phi],[0,-1,phi],[0,1,-phi],[0,-1,-phi],[1,phi,0],[-1,phi,0],[1,-phi,0],[-1,-phi,0],[phi,0,1],[-phi,0,1],[phi,0,-1],[-phi,0,-1]].map(v => { const l = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]); return v.map(c => c/l*0.9); });
  const icosaE: [number, number][] = [[0,1],[0,4],[0,5],[0,8],[0,9],[1,6],[1,7],[1,8],[1,9],[2,3],[2,4],[2,5],[2,10],[2,11],[3,6],[3,7],[3,10],[3,11],[4,5],[4,8],[4,10],[5,9],[5,11],[6,7],[6,8],[6,10],[7,9],[7,11],[8,10],[9,11]];
  const solids = [{v:tetraV,e:tetraE},{v:cubeV,e:cubeE},{v:octaV,e:octaE},{v:dodecaV,e:dodecaE},{v:icosaV,e:icosaE}];

  let seed = 12345;
  function rand(): number { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  const axes: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) { const th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1); axes.push([Math.sin(ph)*Math.cos(th), Math.sin(ph)*Math.sin(th), Math.cos(ph)]); }

  // Load shader from external file
  const shaderResponse = await fetch('/animations/platonic-solids.wgsl');
  const shaderCode = await shaderResponse.text();
  const shaderModule = device.createShaderModule({ code: shaderCode });

  const spherePipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module: shaderModule, entryPoint: 'vsSphere', buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }, { arrayStride: 12, stepMode: 'instance', attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }] }] }, fragment: { module: shaderModule, entryPoint: 'fs', targets: [{ format }] }, primitive: { topology: 'triangle-list', cullMode: 'back' }, depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' } });
  const cylPipeline = device.createRenderPipeline({ layout: 'auto', vertex: { module: shaderModule, entryPoint: 'vsCylinder', buffers: [{ arrayStride: 12, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }] }, { arrayStride: 24, stepMode: 'instance', attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x3' }, { shaderLocation: 2, offset: 12, format: 'float32x3' }] }] }, fragment: { module: shaderModule, entryPoint: 'fs', targets: [{ format }] }, primitive: { topology: 'triangle-list', cullMode: 'back' }, depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' } });

  const solidData = solids.map(s => {
    const vertData = new Float32Array(s.v.flat()), edgeData = new Float32Array(s.e.flatMap(([a,b]) => [...s.v[a], ...s.v[b]]));
    const vertBuf = device.createBuffer({ size: vertData.byteLength, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true }); new Float32Array(vertBuf.getMappedRange()).set(vertData); vertBuf.unmap();
    const edgeBuf = device.createBuffer({ size: edgeData.byteLength, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true }); new Float32Array(edgeBuf.getMappedRange()).set(edgeData); edgeBuf.unmap();
    return { vertBuf, vertCount: s.v.length, edgeBuf, edgeCount: s.e.length };
  });

  const uniforms: GPUBuffer[] = [], sphereBindGroups: GPUBindGroup[] = [], cylBindGroups: GPUBindGroup[] = [];
  for (let i = 0; i < 5; i++) { const buf = device.createBuffer({ size: 160, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }); uniforms.push(buf); sphereBindGroups.push(device.createBindGroup({ layout: spherePipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buf } }] })); cylBindGroups.push(device.createBindGroup({ layout: cylPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: buf } }] })); }

  let depthTexture: GPUTexture | null = null;
  function createDepthTexture(): void { if (depthTexture) depthTexture.destroy(); depthTexture = device.createTexture({ size: [canvas.width, canvas.height], format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT }); }
  createDepthTexture();
  window.addEventListener('resize', () => { resize(); createDepthTexture(); });

  function mulMat4(a: Float32Array, b: Float32Array): Float32Array { const r = new Float32Array(16); for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) r[col * 4 + row] = a[row] * b[col * 4] + a[row + 4] * b[col * 4 + 1] + a[row + 8] * b[col * 4 + 2] + a[row + 12] * b[col * 4 + 3]; return r; }
  function perspective(fov: number, aspect: number, near: number, far: number): Float32Array { const f = 1 / Math.tan(fov / 2), rangeInv = 1 / (near - far); return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(near+far)*rangeInv,-1, 0,0,near*far*rangeInv*2,0]); }
  function translate(tx: number, ty: number, tz: number): Float32Array { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, tx,ty,tz,1]); }
  function rotateAxis(ax: number, ay: number, az: number, angle: number): Float32Array { const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c; return new Float32Array([ax*ax*t+c,ay*ax*t+az*s,az*ax*t-ay*s,0, ax*ay*t-az*s,ay*ay*t+c,az*ay*t+ax*s,0, ax*az*t+ay*s,ay*az*t-ax*s,az*az*t+c,0, 0,0,0,1]); }

  const nearCol = [0.208, 0.655, 0.486, 1], farCol = [0.875, 0.412, 0.729, 1];
  const t0 = performance.now();

  function render(): void {
    const t = (performance.now() - t0) / 1000, aspect = canvas.width / canvas.height;
    const proj = perspective(Math.PI / 4, aspect, 0.1, 100), view = translate(0, 0, -8);
    const spacing = 2.5;
    for (let i = 0; i < 5; i++) { const x = (i - 2) * spacing, [ax, ay, az] = axes[i], angle = t * (0.5 + i * 0.1); const model = mulMat4(translate(x, 0, 0), rotateAxis(ax, ay, az, angle)), modelView = mulMat4(view, model), mvp = mulMat4(proj, modelView); const data = new Float32Array(40); data.set(mvp, 0); data.set(modelView, 16); data.set(nearCol, 32); data.set(farCol, 36); device.queue.writeBuffer(uniforms[i], 0, data); }
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({ colorAttachments: [{ view: ctx!.getCurrentTexture().createView(), clearValue: bgColor, loadOp: 'clear', storeOp: 'store' }], depthStencilAttachment: { view: depthTexture!.createView(), depthClearValue: 1.0, depthLoadOp: 'clear', depthStoreOp: 'store' } });
    pass.setPipeline(cylPipeline); for (let i = 0; i < 5; i++) { pass.setBindGroup(0, cylBindGroups[i]); pass.setVertexBuffer(0, cylVB); pass.setVertexBuffer(1, solidData[i].edgeBuf); pass.setIndexBuffer(cylIB, 'uint16'); pass.drawIndexed(cylinder.indices.length, solidData[i].edgeCount); }
    pass.setPipeline(spherePipeline); for (let i = 0; i < 5; i++) { pass.setBindGroup(0, sphereBindGroups[i]); pass.setVertexBuffer(0, sphereVB); pass.setVertexBuffer(1, solidData[i].vertBuf); pass.setIndexBuffer(sphereIB, 'uint16'); pass.drawIndexed(sphere.indices.length, solidData[i].vertCount); }
    pass.end(); device.queue.submit([encoder.finish()]); requestAnimationFrame(render);
  }
  render();
}
