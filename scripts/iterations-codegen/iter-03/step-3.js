function drawStep(THREE, scene) {
  // 左眼 - 黑色小圆点
  const leftEye = new THREE.Mesh(
    new THREE.CircleGeometry(8),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftEye.position.set(-30, -20, 3);
  scene.add(leftEye);

  // 右眼 - 黑色小圆点
  const rightEye = new THREE.Mesh(
    new THREE.CircleGeometry(8),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightEye.position.set(30, -20, 3);
  scene.add(rightEye);

  // 小鼻子 - 粉色小圆点
  const nose = new THREE.Mesh(
    new THREE.CircleGeometry(7),
    new THREE.MeshBasicMaterial({ color: '#ff9bb3' })
  );
  nose.position.set(0, -42, 3);
  scene.add(nose);

  // 小嘴巴中间短线
  const mouthLine = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 16),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  mouthLine.position.set(0, -55, 3);
  scene.add(mouthLine);

  // 左胡须三根
  const leftWhisker1 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker1.position.set(-55, -38, 3);
  leftWhisker1.rotation.z = 0.15;
  scene.add(leftWhisker1);

  const leftWhisker2 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker2.position.set(-55, -52, 3);
  scene.add(leftWhisker2);

  const leftWhisker3 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  leftWhisker3.position.set(-55, -66, 3);
  leftWhisker3.rotation.z = -0.15;
  scene.add(leftWhisker3);

  // 右胡须三根
  const rightWhisker1 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker1.position.set(55, -38, 3);
  rightWhisker1.rotation.z = -0.15;
  scene.add(rightWhisker1);

  const rightWhisker2 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker2.position.set(55, -52, 3);
  scene.add(rightWhisker2);

  const rightWhisker3 = new THREE.Mesh(
    new THREE.PlaneGeometry(45, 3),
    new THREE.MeshBasicMaterial({ color: '#000000' })
  );
  rightWhisker3.position.set(55, -66, 3);
  rightWhisker3.rotation.z = 0.15;
  scene.add(rightWhisker3);
}