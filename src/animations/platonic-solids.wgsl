struct Uniforms {
  mvp: mat4x4<f32>,
  modelView: mat4x4<f32>,
  nearCol: vec4<f32>,
  farCol: vec4<f32>
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) viewZ: f32
};

@vertex fn vsSphere(@location(0) pos: vec3<f32>, @location(1) instancePos: vec3<f32>) -> VOut {
  var out: VOut;
  let scale = 0.06;
  let worldPos = pos * scale + instancePos;
  out.pos = u.mvp * vec4<f32>(worldPos, 1.0);
  out.viewZ = (u.modelView * vec4<f32>(worldPos, 1.0)).z;
  return out;
}

@vertex fn vsCylinder(@location(0) pos: vec3<f32>, @location(1) p0: vec3<f32>, @location(2) p1: vec3<f32>) -> VOut {
  var out: VOut;
  let radius = 0.025;
  let dir = p1 - p0;
  let len = length(dir);
  let up = normalize(dir);
  var perp1: vec3<f32>;
  if (abs(up.y) < 0.99) {
    perp1 = normalize(cross(up, vec3<f32>(0.0, 1.0, 0.0)));
  } else {
    perp1 = normalize(cross(up, vec3<f32>(1.0, 0.0, 0.0)));
  }
  let perp2 = cross(up, perp1);
  let worldPos = p0 + perp1 * pos.x * radius + up * pos.y * len + perp2 * pos.z * radius;
  out.pos = u.mvp * vec4<f32>(worldPos, 1.0);
  out.viewZ = (u.modelView * vec4<f32>(worldPos, 1.0)).z;
  return out;
}

@fragment fn fs(@location(0) viewZ: f32) -> @location(0) vec4<f32> {
  let t = clamp((-viewZ - 7.0) / 2.5, 0.0, 1.0);
  return vec4<f32>(mix(u.nearCol.rgb, u.farCol.rgb, t), 1.0);
}
