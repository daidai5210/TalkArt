function drawStep(THREE, scene) {
  // 两只黑黑的小眼睛
  const leftEye = new THREE.Mesh(
    new THREE.CircleGeometry(7),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftEye.position.set(-23, 88, 3);
  scene.add(leftEye);

  const rightEye = new THREE.Mesh(
    new THREE.CircleGeometry(7),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightEye.position.set(23, 88, 3);
  scene.add(rightEye);

  // 圆圆的小鼻子
  const nose = new THREE.Mesh(
    new THREE.CircleGeometry(8),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  nose.scale.set(1.25, 0.8, 1);
  nose.position.set(0, 68, 3);
  scene.add(nose);

  // 简单的小嘴巴：两条短短的线
  const mouthLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 22),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  mouthLeft.rotation.z = -0.65;
  mouthLeft.position.set(-7, 53, 3);
  scene.add(mouthLeft);

  const mouthRight = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 22),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  mouthRight.rotation.z = 0.65;
  mouthRight.position.set(7, 53, 3);
  scene.add(mouthRight);

  // 胖胖小狗的小脸蛋
  const leftCheek = new THREE.Mesh(
    new THREE.CircleGeometry(8),
    new THREE.MeshBasicMaterial({ color: '#ffb6b6' })
  );
  leftCheek.position.set(-38, 62, 3);
  scene.add(leftCheek);

  const rightCheek = new THREE.Mesh(
    new THREE.CircleGeometry(8),
    new THREE.MeshBasicMaterial({ color: '#ffb6b6' })
  );
  rightCheek.position.set(38, 62, 3);
  scene.add(rightCheek);
}