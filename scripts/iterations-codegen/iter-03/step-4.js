function drawStep(THREE, scene) {
  // 小猫嘴巴 - 左边小弯线（用短线表示）
  const mouthLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 22),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  mouthLeft.position.set(-8, -52, 4);
  mouthLeft.rotation.z = -Math.PI / 4;
  scene.add(mouthLeft);

  // 小猫嘴巴 - 右边小弯线
  const mouthRight = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 22),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  mouthRight.position.set(8, -52, 4);
  mouthRight.rotation.z = Math.PI / 4;
  scene.add(mouthRight);

  // 左脸胡须 - 三根简单线条
  const leftWhisker1 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker1.position.set(-58, -38, 4);
  leftWhisker1.rotation.z = 0.12;
  scene.add(leftWhisker1);

  const leftWhisker2 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker2.position.set(-60, -50, 4);
  scene.add(leftWhisker2);

  const leftWhisker3 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker3.position.set(-58, -62, 4);
  leftWhisker3.rotation.z = -0.12;
  scene.add(leftWhisker3);

  // 右脸胡须 - 三根简单线条
  const rightWhisker1 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker1.position.set(58, -38, 4);
  rightWhisker1.rotation.z = -0.12;
  scene.add(rightWhisker1);

  const rightWhisker2 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker2.position.set(60, -50, 4);
  scene.add(rightWhisker2);

  const rightWhisker3 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker3.position.set(58, -62, 4);
  rightWhisker3.rotation.z = 0.12;
  scene.add(rightWhisker3);

  // 两个粉粉的小脸蛋
  const leftCheek = new THREE.Mesh(
    new THREE.CircleGeometry(10),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  leftCheek.position.set(-42, -42, 4);
  scene.add(leftCheek);

  const rightCheek = new THREE.Mesh(
    new THREE.CircleGeometry(10),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  rightCheek.position.set(42, -42, 4);
  scene.add(rightCheek);
}