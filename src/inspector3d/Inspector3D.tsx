// ChemLab — interactive chemistry lab
// Copyright (C) 2026 ChemLab contributors
// SPDX-License-Identifier: AGPL-3.0-only

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getElement } from '../domain/data/elements';
import type { LabState } from '../domain/labStore';
import type { MoleculeView } from '../domain/types';
import { t } from '../i18n/ru';
import { useTheme } from '../theme';
import { computeGeometry } from './geometry';

/**
 * FR-9/FR-10: шаростержневая модель выбранной молекулы, вращение и зум.
 * Read-only потребитель модели (P3): редактирование только в 2D.
 */

interface Inspector3DProps {
  molecule: MoleculeView | null;
  state: LabState;
}

/** Условные радиусы шаров (∝ Ван-дер-Ваальсовым, масштаб условный — FR-9). */
function atomRadius(symbol: string): number {
  return symbol === 'H' ? 0.22 : 0.34;
}

export function Inspector3D({ molecule, state }: Inspector3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglError, setWebglError] = useState(false);
  // FR-38: фон 3D-сцены следует теме.
  const { mode } = useTheme();

  const geometry = molecule
    ? computeGeometry(
        molecule.atomIds.map((id) => state.atoms[id]),
        molecule.bondIds.map((id) => state.bonds[id]),
      )
    : null;

  useEffect(() => {
    const mount = mountRef.current;
    if (!molecule || !geometry || !mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setWebglError(true);
      return;
    }

    const scene = new THREE.Scene();
    const dark = document.documentElement.classList.contains('dark');
    scene.background = new THREE.Color(dark ? '#0f172a' : '#f1f5f9');

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const directional = new THREE.DirectionalLight(0xffffff, 1.4);
    directional.position.set(3, 4, 5);
    scene.add(directional);

    const group = new THREE.Group();

    // Центрируем модель.
    const center = new THREE.Vector3();
    for (const position of geometry.positions.values()) {
      center.add(new THREE.Vector3(...position));
    }
    center.divideScalar(Math.max(1, geometry.positions.size));

    for (const atomId of molecule.atomIds) {
      const atom = state.atoms[atomId];
      const element = getElement(atom.element);
      const position = geometry.positions.get(atomId) ?? [0, 0, 0];
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(atomRadius(atom.element), 32, 24),
        new THREE.MeshStandardMaterial({ color: element.cpkColor }),
      );
      sphere.position.set(
        position[0] - center.x,
        position[1] - center.y,
        position[2] - center.z,
      );
      group.add(sphere);
    }

    for (const bondId of molecule.bondIds) {
      const bond = state.bonds[bondId];
      const pa = geometry.positions.get(bond.atomIds[0]);
      const pb = geometry.positions.get(bond.atomIds[1]);
      if (!pa || !pb) continue;
      const start = new THREE.Vector3(pa[0] - center.x, pa[1] - center.y, pa[2] - center.z);
      const end = new THREE.Vector3(pb[0] - center.x, pb[1] - center.y, pb[2] - center.z);

      // Кратность связи = число стержней (FR-9).
      const axis = end.clone().sub(start).normalize();
      const across = new THREE.Vector3(0, 1, 0).cross(axis);
      if (across.lengthSq() < 1e-6) across.set(1, 0, 0);
      across.normalize();
      const offsets =
        bond.order === 1 ? [0] : bond.order === 2 ? [-0.09, 0.09] : [-0.15, 0, 0.15];

      for (const offset of offsets) {
        const shift = across.clone().multiplyScalar(offset);
        const s = start.clone().add(shift);
        const e = end.clone().add(shift);
        const length = s.distanceTo(e);
        const cylinder = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, length, 12),
          new THREE.MeshStandardMaterial({ color: '#cbd5e1' }),
        );
        cylinder.position.copy(s.clone().add(e).multiplyScalar(0.5));
        cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
        group.add(cylinder);
      }
    }

    scene.add(group);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      if (clientWidth === 0 || clientHeight === 0) return;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    mount.appendChild(renderer.domElement);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [molecule, geometry, state, mode]);

  return (
    <section aria-label={t('inspector.title')} className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-700">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {t('inspector.title')}
        </h2>
        {geometry && (
          <span
            className={`rounded px-2 py-0.5 text-xs ${
              geometry.schematic
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
            }`}
          >
            {geometry.schematic ? t('inspector.schematic') : t('inspector.reference')}
          </span>
        )}
      </div>
      <div ref={mountRef} className="relative min-h-0 flex-1">
        {!molecule && (
          <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-slate-400 dark:text-slate-500">
            {t('inspector.none')}
          </p>
        )}
        {webglError && (
          <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-600 dark:text-red-300">
            {t('inspector.webglError')}
          </p>
        )}
      </div>
    </section>
  );
}
