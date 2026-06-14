function drawStep(THREE, scene) {
  // 额头中间小花纹
  const stripeMiddle = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 28),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  stripeMiddle.position.set(0, 75, 4);
  scene.add(stripeMiddle);

  // 左额头小花纹
  const stripeLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 24),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  stripeLeft.position.set(-18, 70, 4);
  stripeLeft.rotation.z = -0.35;
  scene.add(stripeLeft);

  // 右额头小花纹
  const stripeRight = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 24),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  stripeRight.position.set(18, 70, 4);
  stripeRight.rotation.z = 0.35;
  scene.add(stripeRight);

  // 肚皮 - 淡黄色小圆圈
  const belly = new THREE.Mesh(
    new THREE.CircleGeometry(35),
    new THREE.MeshBasicMaterial({ color: '#fff2c6' })
  );
  belly.position.set(0, -85, 3);
  scene.add(belly);

  // 尾巴上的一条小花纹
  const tailStripe = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 4),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  tailStripe.position.set(115, -30, 4);
  tailStripe.rotation.z = -0.55;
  scene.add(tailStripe);
}