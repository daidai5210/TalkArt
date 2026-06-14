function drawStep(THREE, scene) {
  // 左耳朵 - 黑色三角外轮廓
  const leftEarOutline = new THREE.Mesh(
    new THREE.CircleGeometry(40, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftEarOutline.position.set(-55, 45, 0);
  leftEarOutline.rotation.z = Math.PI / 2;
  scene.add(leftEarOutline);

  // 左耳朵 - 白色填充
  const leftEar = new THREE.Mesh(
    new THREE.CircleGeometry(32, 3),
    new THREE.MeshBasicMaterial({ color: '#ffffff' })
  );
  leftEar.position.set(-55, 43, 1);
  leftEar.rotation.z = Math.PI / 2;
  scene.add(leftEar);

  // 右耳朵 - 黑色三角外轮廓
  const rightEarOutline = new THREE.Mesh(
    new THREE.CircleGeometry(40, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightEarOutline.position.set(55, 45, 0);
  rightEarOutline.rotation.z = Math.PI / 2;
  scene.add(rightEarOutline);

  // 右耳朵 - 白色填充
  const rightEar = new THREE.Mesh(
    new THREE.CircleGeometry(32, 3),
    new THREE.MeshBasicMaterial({ color: '#ffffff' })
  );
  rightEar.position.set(55, 43, 1);
  rightEar.rotation.z = Math.PI / 2;
  scene.add(rightEar);
}