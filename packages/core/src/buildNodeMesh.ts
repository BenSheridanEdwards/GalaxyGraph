import * as THREE from "three";
import { mutColor, displayName, serviceIcon } from "./helpers";
import { makeServiceSunSprite } from "./billboard";
import type { GraphNode } from "./types";

export interface BondMeshRef {
  group: THREE.Object3D;
  producerId: string;
  consumerId: string;
}

export interface MeshContext {
  ringMeshes: THREE.Mesh[];
  bondMeshes: BondMeshRef[];
}

export function makeBuildNodeMesh(ctx: MeshContext) {
  return function buildNodeMesh(n: GraphNode): THREE.Object3D {
    if (n.kind === "service") {
      // Service node = white solid sphere ("sun") + camera-facing sprite
      // overlay carrying the black symbol+name, with status-colour halos
      // behind for coverage. The sphere guarantees a visible white core
      // even if the sprite ever fails to upload its texture; the sprite
      // sits on top with depthTest:false + renderOrder:1000 so the label
      // wins over any transparent halo geometry.
      const grp = new THREE.Group();
      const r = 16;
      const score = n.mutation ? n.mutation.score : null;
      const statusColor = mutColor(score);

      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(r * 1.85, 24, 24),
        new THREE.MeshBasicMaterial({
          color: statusColor, transparent: true, opacity: 0.12,
          side: THREE.BackSide, depthWrite: false,
        })
      ));
      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(r * 1.5, 24, 24),
        new THREE.MeshBasicMaterial({
          color: statusColor, transparent: true, opacity: 0.32,
          side: THREE.BackSide, depthWrite: false,
        })
      ));
      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(r, 32, 32),
        new THREE.MeshLambertMaterial({
          color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.85,
        })
      ));

      // Sprite is repositioned via onBeforeRender every render frame to
      // sit just outside the sphere on the camera-facing side — that
      // physically guarantees the label is between the camera and the
      // sphere from any orbit angle. onEngineTick wasn't enough because
      // it stops firing after the physics simulation cools down, leaving
      // the label parked inside the sphere.
      const sun = makeServiceSunSprite(serviceIcon(n.svc), displayName(n.svc));
      const sunOffset = r + 1.5;
      const camDir = new THREE.Vector3();
      const grpWorld = new THREE.Vector3();
      sun.onBeforeRender = (_renderer, _scene, camera) => {
        grp.getWorldPosition(grpWorld);
        camDir.copy(camera.position).sub(grpWorld);
        const len = camDir.length();
        if (len < 1e-6) return;
        camDir.multiplyScalar(sunOffset / len);
        sun.position.copy(camDir);
      };
      grp.add(sun);
      return grp;
    }

    if (n.kind === "endpoint") {
      const grp = new THREE.Group();
      const r = 5.5;
      const score = n.mutation ? n.mutation.score : null;
      const ringColor = mutColor(score);

      grp.add(new THREE.Mesh(
        new THREE.SphereGeometry(r, 20, 20),
        new THREE.MeshLambertMaterial({ color: n.color, emissive: n.color, emissiveIntensity: 0.4 })
      ));

      const ringRadius = r * 1.9;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(ringRadius, 0.45, 12, 64),
        new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.9 })
      );
      ring.rotation.x = Math.PI / 2.4;
      (ring.userData as { spin: number }).spin = 0.004;
      ctx.ringMeshes.push(ring);
      grp.add(ring);

      if (score != null && score > 0) {
        const ratio = Math.max(0.05, score / 100);
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(ringRadius, 0.45 + 1.5 * ratio, 12, 64, Math.PI * 2 * ratio),
          new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.55 })
        );
        arc.rotation.x = Math.PI / 2.4;
        grp.add(arc);
      }
      return grp;
    }

    if (n.kind === "bond" && n.contract) {
      // Cylinder: a discrete, hoverable mid-rope marker for direct-call
      // contracts — parallel to the topic octahedron for event-bus.
      // Sized to match topic radius (~11) so both contract markers feel
      // like equally-clickable stops along the bond, just shaped
      // differently so the kind reads at a glance.
      const grp = new THREE.Group();
      const radius = 6.5;
      const height = 22;
      grp.add(new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, height, 24, 1),
        new THREE.MeshLambertMaterial({ color: n.color, emissive: n.color, emissiveIntensity: 0.55 })
      ));
      grp.add(new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.4, radius * 1.4, height * 1.25, 24, 1),
        new THREE.MeshBasicMaterial({ color: n.color, transparent: true, opacity: 0.2, wireframe: true })
      ));
      // Orientation is set per-frame in onEngineTick so the cylinder's
      // long axis lines up with the producer→consumer rope. Default Y
      // here is just the resting state before the first layout tick.
      ctx.bondMeshes.push({
        group: grp,
        producerId: `svc:${n.contract.producer}`,
        consumerId: `svc:${n.contract.consumer}`,
      });
      return grp;
    }

    if (n.kind === "topic") {
      // Octahedron: visually distinct from spheres so topics read as
      // event-bus relays even at a glance. Slow spin reinforces that
      // it is a moving point of fan-out. Sized large enough to be a
      // comfortable hover target — service spheres are r=16 and
      // endpoint spheres r=5.5, so 11 sits between them and still
      // reads as a "stop along the bond" rather than a third service.
      const grp = new THREE.Group();
      const r = 11;
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(r, 0),
        new THREE.MeshLambertMaterial({ color: n.color, emissive: n.color, emissiveIntensity: 0.55 })
      );
      grp.add(core);
      grp.add(new THREE.Mesh(
        new THREE.OctahedronGeometry(r * 1.5, 0),
        new THREE.MeshBasicMaterial({ color: n.color, transparent: true, opacity: 0.18, wireframe: true })
      ));
      (core.userData as { spin: number }).spin = 0.012;
      ctx.ringMeshes.push(core);
      return grp;
    }

    // test node
    const r = n.http ? 2.0 : 1.6;
    return new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 10),
      new THREE.MeshBasicMaterial({ color: n.color, transparent: true, opacity: n.http ? 0.9 : 0.65 })
    );
  };
}
