function drawStep(THREE, scene) {
  // 小嘴巴中间短线
  const mouthLine = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 18),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  mouthLine.position.set(0, 18, 0.2);
  scene.add(mouthLine);

  // 左边小嘴
  const leftMouth = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 22),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftMouth.position.set(-8, 8, 0.2);
  leftMouth.rotation.z = -0.6;
  scene.add(leftMouth);

  // 右边小嘴
  const rightMouth = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 22),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightMouth.position.set(8, 8, 0.2);
  rightMouth.rotation.z = 0.6;
  scene.add(rightMouth);

  // 左边胡须 1
  const leftWhisker1 = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker1.position.set(-58, 28, 0.2);
  leftWhisker1.rotation.z = 0.15;
  scene.add(leftWhisker1);

  // 左边胡须 2
  const leftWhisker2 = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker2.position.set(-58, 16, 0.2);
  scene.add(leftWhisker2);

  // 右边胡须 1
  const rightWhisker1 = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker1.position.set(58, 28, 0.2);
  rightWhisker1.rotation.z = -0.15;
  scene.add(rightWhisker1);

  // 右边胡须 2
  const rightWhisker2 = new THREE.Mesh(
    new THREE.PlaneGeometry(55, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker2.position.set(58, 16, 0.2);
  scene.add(rightWhisker2);

  // 两个粉色小脸蛋
  const leftCheek = new THREE.Mesh(
    new THREE.CircleGeometry(10),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  leftCheek.position.set(-38, 18, 0.15);
  scene.add(leftCheek);

  const rightCheek = new THREE.Mesh(
    new THREE.CircleGeometry(10),
    new THREE.MeshBasicMaterial({ color: '#ffb6c1' })
  );
  rightCheek.position.set(38, 18, 0.15);
  scene.add(rightCheek);
}