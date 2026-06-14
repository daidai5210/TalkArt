function drawStep(THREE, scene) {
  // 左耳朵里面 - 粉色小三角
  const leftInnerEar = new THREE.Mesh(
    new THREE.CircleGeometry(20, 3),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  leftInnerEar.position.set(-55, 45, 5);
  leftInnerEar.rotation.z = Math.PI / 2;
  scene.add(leftInnerEar);

  // 右耳朵里面 - 粉色小三角
  const rightInnerEar = new THREE.Mesh(
    new THREE.CircleGeometry(20, 3),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  rightInnerEar.position.set(55, 45, 5);
  rightInnerEar.rotation.z = Math.PI / 2;
  scene.add(rightInnerEar);

  // 左脸蛋 - 淡粉色小圆
  const leftCheek = new THREE.Mesh(
    new THREE.CircleGeometry(12),
    new THREE.MeshBasicMaterial({ color: '#ffd6dc' })
  );
  leftCheek.position.set(-48, -42, 5);
  scene.add(leftCheek);

  // 右脸蛋 - 淡粉色小圆
  const rightCheek = new THREE.Mesh(
    new THREE.CircleGeometry(12),
    new THREE.MeshBasicMaterial({ color: '#ffd6dc' })
  );
  rightCheek.position.set(48, -42, 5);
  scene.add(rightCheek);

  // 额头中间的小花纹
  const stripeMiddle = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 25),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  stripeMiddle.position.set(0, 22, 6);
  scene.add(stripeMiddle);

  // 额头左边的小花纹
  const stripeLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 20),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  stripeLeft.position.set(-18, 18, 6);
  stripeLeft.rotation.z = -Math.PI / 6;
  scene.add(stripeLeft);

  // 额头右边的小花纹
  const stripeRight = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 20),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  stripeRight.position.set(18, 18, 6);
  stripeRight.rotation.z = Math.PI / 6;
  scene.add(stripeRight);
}