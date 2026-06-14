function drawStep(THREE, scene) {
  // 小猫主体 - 大圆圈外轮廓
  const bodyOutline = new THREE.Mesh(
    new THREE.CircleGeometry(95),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  bodyOutline.position.set(0, -40, 0);
  scene.add(bodyOutline);

  // 小猫主体 - 白色填充
  const body = new THREE.Mesh(
    new THREE.CircleGeometry(88),
    new THREE.MeshBasicMaterial({ color: '#ffffff' })
  );
  body.position.set(0, -40, 1);
  scene.add(body);
}