function drawStep(THREE, scene) {
  // 额头中间小花纹
  const stripeMiddle = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 28),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  stripeMiddle.position.set(0, 72, 0.4);
  scene.add(stripeMiddle);

  // 左额头小花纹
  const stripeLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 24),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  stripeLeft.position.set(-18, 68, 0.4);
  stripeLeft.rotation.z = -0.45;
  scene.add(stripeLeft);

  // 右额头小花纹
  const stripeRight = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 24),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  stripeRight.position.set(18, 68, 0.4);
  stripeRight.rotation.z = 0.45;
  scene.add(stripeRight);

  // 左脸粉色小腮红
  const leftBlush = new THREE.Mesh(
    new THREE.CircleGeometry(10),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  leftBlush.scale.set(1.4, 0.7, 1);
  leftBlush.position.set(-42, 5, 0.35);
  scene.add(leftBlush);

  // 右脸粉色小腮红
  const rightBlush = new THREE.Mesh(
    new THREE.CircleGeometry(10),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  rightBlush.scale.set(1.4, 0.7, 1);
  rightBlush.position.set(42, 5, 0.35);
  scene.add(rightBlush);
}