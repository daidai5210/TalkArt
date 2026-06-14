function drawStep(THREE, scene) {
  // 右边小尾巴 - 黑色外轮廓，一个弯弯的小椭圆
  const tailOutline = new THREE.Mesh(
    new THREE.CircleGeometry(28),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  tailOutline.scale.set(0.45, 1.1, 1);
  tailOutline.rotation.z = -0.8;
  tailOutline.position.set(112, -18, 2);
  scene.add(tailOutline);

  const tail = new THREE.Mesh(
    new THREE.CircleGeometry(22),
    new THREE.MeshBasicMaterial({ color: '#fff7df' })
  );
  tail.scale.set(0.45, 1.1, 1);
  tail.rotation.z = -0.8;
  tail.position.set(112, -18, 3);
  scene.add(tail);

  // 左边短短的小脚 - 黑色外轮廓
  const leftPawOutline = new THREE.Mesh(
    new THREE.CircleGeometry(24),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftPawOutline.scale.set(1.05, 0.65, 1);
  leftPawOutline.position.set(-45, -122, 4);
  scene.add(leftPawOutline);

  const leftPaw = new THREE.Mesh(
    new THREE.CircleGeometry(18),
    new THREE.MeshBasicMaterial({ color: '#fff7df' })
  );
  leftPaw.scale.set(1.05, 0.65, 1);
  leftPaw.position.set(-45, -122, 5);
  scene.add(leftPaw);

  // 右边短短的小脚 - 黑色外轮廓
  const rightPawOutline = new THREE.Mesh(
    new THREE.CircleGeometry(24),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightPawOutline.scale.set(1.05, 0.65, 1);
  rightPawOutline.position.set(45, -122, 4);
  scene.add(rightPawOutline);

  const rightPaw = new THREE.Mesh(
    new THREE.CircleGeometry(18),
    new THREE.MeshBasicMaterial({ color: '#fff7df' })
  );
  rightPaw.scale.set(1.05, 0.65, 1);
  rightPaw.position.set(45, -122, 5);
  scene.add(rightPaw);

  // 肚子上一条简单的小弧线，用细长矩形表示
  const bellyLine = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 4),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  bellyLine.position.set(0, -70, 6);
  scene.add(bellyLine);
}