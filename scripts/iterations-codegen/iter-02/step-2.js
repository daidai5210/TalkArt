function drawStep(THREE, scene) {
  // 左眼 - 黑色小圆圈
  const leftEye = new THREE.Mesh(
    new THREE.CircleGeometry(8),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftEye.position.set(-28, 45, 0.1);
  scene.add(leftEye);

  // 右眼 - 黑色小圆圈
  const rightEye = new THREE.Mesh(
    new THREE.CircleGeometry(8),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightEye.position.set(28, 45, 0.1);
  scene.add(rightEye);

  // 小鼻子 - 粉色圆点
  const nose = new THREE.Mesh(
    new THREE.CircleGeometry(7),
    new THREE.MeshBasicMaterial({ color: '#ff9eb5' })
  );
  nose.scale.set(1.2, 0.8, 1);
  nose.position.set(0, 22, 0.1);
  scene.add(nose);

  // 画简单线条的小工具
  function addLine(x, y, length, angle) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(length, 3),
      new THREE.MeshBasicMaterial({ color: '#000000' })
    );
    line.position.set(x, y, 0.1);
    line.rotation.z = angle;
    scene.add(line);
  }

  // 小嘴巴
  addLine(-6, 10, 16, -0.7);
  addLine(6, 10, 16, 0.7);

  // 左边胡须
  addLine(-45, 25, 45, 0.15);
  addLine(-45, 10, 45, -0.15);

  // 右边胡须
  addLine(45, 25, 45, -0.15);
  addLine(45, 10, 45, 0.15);
}