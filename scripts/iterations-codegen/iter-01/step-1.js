function drawStep(THREE, scene) {
  // 胖胖小狗的主体身体：一个大大的圆肚子
  const bodyOutline = new THREE.Mesh(
    new THREE.CircleGeometry(95),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  bodyOutline.scale.set(1.25, 0.95, 1);
  bodyOutline.position.set(0, -40, 0);
  scene.add(bodyOutline);

  const body = new THREE.Mesh(
    new THREE.CircleGeometry(88),
    new THREE.MeshBasicMaterial({ color: '#fff7df' })
  );
  body.scale.set(1.25, 0.95, 1);
  body.position.set(0, -40, 1);
  scene.add(body);
}