function drawStep(THREE, scene) {
  // 小猫身体外轮廓 - 大椭圆（黑色描边）
  const bodyOutline = new THREE.Mesh(
    new THREE.CircleGeometry(90),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  bodyOutline.scale.set(1.15, 0.85, 1);
  bodyOutline.position.set(0, -80, 0);
  scene.add(bodyOutline);

  // 小猫身体 - 白色填充
  const body = new THREE.Mesh(
    new THREE.CircleGeometry(84),
    new THREE.MeshBasicMaterial({ color: '#ffffff' })
  );
  body.scale.set(1.15, 0.85, 1);
  body.position.set(0, -80, 0.1);
  scene.add(body);

  // 小猫头部外轮廓 - 大圆圈（黑色描边）
  const headOutline = new THREE.Mesh(
    new THREE.CircleGeometry(85),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  headOutline.position.set(0, 55, 0);
  scene.add(headOutline);

  // 小猫头部 - 白色填充
  const head = new THREE.Mesh(
    new THREE.CircleGeometry(79),
    new THREE.MeshBasicMaterial({ color: '#ffffff' })
  );
  head.position.set(0, 55, 0.1);
  scene.add(head);
}